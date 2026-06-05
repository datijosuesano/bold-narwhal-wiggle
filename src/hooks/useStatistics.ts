import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

export interface AssetData {
  id: string;
  status: string;
  location: string;
  purchase_cost: number;
  commissioning_date: string | null;
}

export interface WorkOrderData {
  id: string;
  created_at: string;
  status: string;
  asset_id: string | null;
  priority: string;
  maintenance_type: string;
  closed_at: string | null;
  time_spent_minutes: number | null;
}

export interface InterventionData {
  id: string;
  created_at: string;
  asset_id: string | null;
  maintenance_type: string;
  intervention_date: string;
  total_cost: number | null;
  intervention_place: string | null;
  start_date: string | null;
  end_date: string | null;
  assets: {
    location: string;
  } | null;
}

export const useStatistics = (periodDays: number) => {
  const [workOrders, setWorkOrders] = useState<WorkOrderData[]>([]);
  const [interventions, setInterventions] = useState<InterventionData[]>([]);
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatisticsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const thresholdDate = subDays(new Date(), periodDays).toISOString();

      // 1. Récupérer les équipements (tous, pour le calcul de disponibilité globale)
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('id, status, location, purchase_cost, commissioning_date');

      if (assetsError) throw assetsError;

      // 2. Récupérer les ordres de travail créés dans la période
      const { data: woData, error: woError } = await supabase
        .from('work_orders')
        .select('id, created_at, status, asset_id, priority, maintenance_type, closed_at, time_spent_minutes')
        .gte('created_at', thresholdDate);

      if (woError) throw woError;

      // 3. Récupérer les interventions réalisées dans la période
      const { data: interventionsData, error: interventionsError } = await supabase
        .from('interventions')
        .select('id, created_at, asset_id, maintenance_type, intervention_date, total_cost, intervention_place, start_date, end_date, assets(location)')
        .gte('intervention_date', thresholdDate.split('T')[0]);

      if (interventionsError) throw interventionsError;

      setAssets((assetsData as unknown as AssetData[]) || []);
      setWorkOrders((woData as unknown as WorkOrderData[]) || []);
      setInterventions((interventionsData as unknown as any[]) || []);
    } catch (err: any) {
      console.error('[useStatistics] Error fetching statistics:', err);
      setError(err.message || "Une erreur est survenue lors de la récupération des données.");
    } finally {
      setIsLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    fetchStatisticsData();
  }, [fetchStatisticsData]);

  return {
    workOrders,
    interventions,
    assets,
    isLoading,
    error,
    refetch: fetchStatisticsData
  };
};