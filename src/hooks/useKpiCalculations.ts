import { useMemo } from 'react';
import { differenceInDays, differenceInHours } from 'date-fns';
import { AssetData, WorkOrderData, InterventionData } from './useStatistics';

export interface KpiMetrics {
  avgReactionTime: number; // en jours
  mttr: number; // en heures
  mtbf: number; // en heures
  preventiveRate: number; // en %
  availability: number; // en %
  totalInterventions: number;
  totalOTs: number;
  bySite: { name: string; value: number }[];
  byType: { name: string; value: number }[];
  byPlace: { name: string; value: number }[];
}

export const useKpiCalculations = (
  workOrders: WorkOrderData[],
  interventions: InterventionData[],
  assets: AssetData[],
  periodDays: number
): KpiMetrics => {
  return useMemo(() => {
    const totalAssets = assets.length || 1;
    const periodHours = periodDays * 24;
    const totalPeriodHoursAllAssets = totalAssets * periodHours;

    // ==========================================
    // 1. TEMPS DE RÉACTION MOYEN (OT créé -> Intervention terminée)
    // ==========================================
    let totalReactionDays = 0;
    let reactionCount = 0;

    workOrders.forEach(ot => {
      if (ot.closed_at) {
        const start = new Date(ot.created_at);
        const end = new Date(ot.closed_at);
        const diff = differenceInDays(end, start);
        if (diff >= 0) {
          totalReactionDays += diff;
          reactionCount++;
        }
      }
    });

    const avgReactionTime = reactionCount > 0 ? parseFloat((totalReactionDays / reactionCount).toFixed(1)) : 0;

    // ==========================================
    // 2. MTTR (Mean Time To Repair)
    // ==========================================
    let totalRepairHours = 0;
    let repairCount = 0;

    // Utilisation des minutes saisies dans les ordres de travail clôturés
    workOrders.forEach(ot => {
      if (ot.status === 'Terminé' && ot.time_spent_minutes && ot.time_spent_minutes > 0) {
        totalRepairHours += ot.time_spent_minutes / 60;
        repairCount++;
      }
    });

    // Fallback sur la différence start_date / end_date des interventions correctives si pas de minutes d'OT
    if (repairCount === 0) {
      interventions.forEach(inv => {
        if (inv.start_date && inv.end_date && inv.maintenance_type === 'Corrective') {
          const start = new Date(inv.start_date);
          const end = new Date(inv.end_date);
          const diffHours = differenceInHours(end, start);
          if (diffHours > 0) {
            totalRepairHours += diffHours;
            repairCount++;
          }
        }
      });
    }

    const mttr = repairCount > 0 ? parseFloat((totalRepairHours / repairCount).toFixed(1)) : 0;

    // ==========================================
    // 3. MTBF & DISPONIBILITÉ
    // ==========================================
    // Nombre de pannes (interventions correctives ou curatives)
    const correctiveInterventions = interventions.filter(inv => 
      inv.maintenance_type === 'Corrective' || inv.maintenance_type === 'Curative'
    );
    const failureCount = correctiveInterventions.length;

    // Temps total d'arrêt (Downtime) estimé à partir du MTTR * Nombre de pannes
    const totalDowntimeHours = failureCount * (mttr || 2); // Fallback à 2h par panne si MTTR est à 0
    const totalUptimeHours = Math.max(0, totalPeriodHoursAllAssets - totalDowntimeHours);

    // MTBF = Temps de bon fonctionnement / Nombre de pannes
    const mtbf = failureCount > 0 ? parseFloat((totalUptimeHours / failureCount).toFixed(1)) : periodHours;

    // Disponibilité = (Uptime / Temps total) * 100
    const availability = parseFloat(((totalUptimeHours / totalPeriodHoursAllAssets) * 100).toFixed(1));

    // ==========================================
    // 4. TAUX DE MAINTENANCE PRÉVENTIVE
    // ==========================================
    const preventiveCount = interventions.filter(inv => 
      inv.maintenance_type === 'Préventive' || inv.maintenance_type === 'Preventive'
    ).length;
    const totalInterventions = interventions.length;
    const preventiveRate = totalInterventions > 0 ? Math.round((preventiveCount / totalInterventions) * 100) : 0;

    // ==========================================
    // 5. DISTRIBUTIONS POUR LES GRAPHIQUES
    // ==========================================
    const siteMap = new Map<string, number>();
    const placeMap = new Map<string, number>();
    const typeMap = new Map<string, number>();

    interventions.forEach(inv => {
      // Par site
      const site = inv.assets?.location || "Inconnu";
      siteMap.set(site, (siteMap.get(site) || 0) + 1);

      // Par lieu d'intervention
      const place = inv.intervention_place || "Sur Site";
      placeMap.set(place, (placeMap.get(place) || 0) + 1);

      // Par type de maintenance
      const type = inv.maintenance_type || "Autre";
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });

    return {
      avgReactionTime,
      mttr,
      mtbf,
      preventiveRate,
      availability: Math.min(100, Math.max(0, availability)),
      totalInterventions,
      totalOTs: workOrders.length,
      bySite: Array.from(siteMap.entries()).map(([name, value]) => ({ name, value })),
      byPlace: Array.from(placeMap.entries()).map(([name, value]) => ({ name, value })),
      byType: Array.from(typeMap.entries()).map(([name, value]) => ({ name, value })),
    };
  }, [workOrders, interventions, assets, periodDays]);
};