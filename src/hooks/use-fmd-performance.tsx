import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { showError } from '@/utils/toast';
import { differenceInMilliseconds, differenceInHours } from 'date-fns';

interface BreakdownEvent {
  id: string;
  asset_id: string;
  breakdown_start: string; // ISO string
  breakdown_end: string; // ISO string
  repair_start: string | null;
  repair_end: string | null;
  is_planned_stop: boolean;
}

interface FMDMetrics {
  mttr: number; // Hours
  mtbf: number; // Hours
  availability: number; // Percentage
  totalBreakdowns: number;
}

// Période d'analyse par défaut: 30 jours (en millisecondes)
const DEFAULT_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; 

// Données mockées pour simuler des événements de panne sur 30 jours
const mockBreakdownEvents: BreakdownEvent[] = [
  {
    id: 'B1',
    asset_id: 'EQ-001',
    breakdown_start: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 10 jours
    breakdown_end: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // Durée 4h
    repair_start: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(), // Réparation après 1h
    repair_end: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // Réparation durée 2h
    is_planned_stop: false,
  },
  {
    id: 'B2',
    asset_id: 'EQ-001',
    breakdown_start: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 25 jours
    breakdown_end: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(), // Durée 8h
    repair_start: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // Réparation après 2h
    repair_end: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(), // Réparation durée 4h
    is_planned_stop: false,
  },
  // Événement planifié (ne compte pas dans MTTR/MTBF)
  {
    id: 'B3',
    asset_id: 'EQ-002',
    breakdown_start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    breakdown_end: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
    repair_start: null,
    repair_end: null,
    is_planned_stop: true,
  },
];

export const useFMDPerformance = (assetId?: string, periodDays: number = 30) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<BreakdownEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBreakdownEvents = async () => {
    if (!user) {
      // Si non authentifié, utiliser les mocks
      setEvents(mockBreakdownEvents);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('breakdown_events')
      .select('*')
      .gte('breakdown_start', startDate)
      .order('breakdown_start', { ascending: false });

    if (assetId) {
      query = query.eq('asset_id', assetId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error fetching breakdown events:", error);
      // SOLUTION PALLIATIVE: Utiliser les données mockées en cas d'échec de la connexion à la table
      showError("Erreur de chargement des données de performance. Utilisation des données de démonstration.");
      setEvents(mockBreakdownEvents.filter(e => !assetId || e.asset_id === assetId));
      setError(error.message);
    } else {
      setEvents(data as BreakdownEvent[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBreakdownEvents();
  }, [user, assetId, periodDays]);

  const metrics: FMDMetrics = useMemo(() => {
    if (!events.length) {
      return { mttr: 0, mtbf: 0, availability: 100, totalBreakdowns: 0 };
    }

    const completedBreakdowns = events.filter(e => 
      !e.is_planned_stop && e.breakdown_end && e.repair_start && e.repair_end
    );
    
    const totalBreakdowns = completedBreakdowns.length;

    if (totalBreakdowns === 0) {
      return { mttr: 0, mtbf: 0, availability: 100, totalBreakdowns: 0 };
    }

    let totalRepairTimeMs = 0; // TRT
    let totalDowntimeMs = 0; // TAT

    completedBreakdowns.forEach(event => {
      const repairStart = new Date(event.repair_start!);
      const repairEnd = new Date(event.repair_end!);
      const breakdownStart = new Date(event.breakdown_start);
      const breakdownEnd = new Date(event.breakdown_end!);

      // 1. Calcul du Temps de Réparation Technique (TRT)
      totalRepairTimeMs += differenceInMilliseconds(repairEnd, repairStart);
      
      // 2. Calcul du Temps d'Arrêt Total (TAT)
      totalDowntimeMs += differenceInMilliseconds(breakdownEnd, breakdownStart);
    });

    // Période d'analyse en millisecondes (pour le MTBF)
    // Nous utilisons la période définie par l'utilisateur (periodDays)
    const analysisPeriodMs = periodDays * 24 * 60 * 60 * 1000;
    
    // 3. Temps de Bon Fonctionnement (TBF)
    const totalUptimeMs = analysisPeriodMs - totalDowntimeMs;

    // --- Calcul des KPIs ---
    
    // MTTR (en heures)
    const mttrHours = totalRepairTimeMs > 0 ? (totalRepairTimeMs / totalBreakdowns) / (1000 * 60 * 60) : 0;

    // MTBF (en heures)
    const mtbfHours = totalUptimeMs > 0 ? (totalUptimeMs / totalBreakdowns) / (1000 * 60 * 60) : 0;

    // Disponibilité (%)
    let availability = 100;
    if (mtbfHours + mttrHours > 0) {
        availability = (mtbfHours / (mtbfHours + mttrHours)) * 100;
    }

    return {
      mttr: parseFloat(mttrHours.toFixed(2)),
      mtbf: parseFloat(mtbfHours.toFixed(2)),
      availability: parseFloat(availability.toFixed(2)),
      totalBreakdowns,
    };
  }, [events, periodDays]);

  return { metrics, isLoading, error, fetchBreakdownEvents };
};