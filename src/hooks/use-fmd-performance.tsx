import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { showError } from '@/utils/toast';
import { differenceInMilliseconds } from 'date-fns';

interface BreakdownEvent {
  id: string;
  asset_id: string;
  breakdown_start: string;
  breakdown_end: string | null;
  repair_start: string | null;
  repair_end: string | null;
  is_planned_stop: boolean;
}

interface FMDMetrics {
  mttr: number;
  mtbf: number;
  availability: number;
  totalBreakdowns: number;
}

export const useFMDPerformance = (assetId?: string, periodDays: number = 30) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<BreakdownEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBreakdownEvents = async () => {
    if (!user) return;

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

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error("Supabase error:", fetchError);
      setError(fetchError.message);
    } else {
      setEvents(data as BreakdownEvent[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBreakdownEvents();
  }, [user, assetId, periodDays]);

  const metrics: FMDMetrics = useMemo(() => {
    const analysisPeriodMs = periodDays * 24 * 60 * 60 * 1000;
    
    if (!events || events.length === 0) {
      return { mttr: 0, mtbf: 0, availability: 100, totalBreakdowns: 0 };
    }

    // Filtrer les pannes réelles terminées
    const actualBreakdowns = events.filter(e => 
      !e.is_planned_stop && e.breakdown_end && e.repair_start && e.repair_end
    );
    
    const count = actualBreakdowns.length;
    if (count === 0) {
      return { mttr: 0, mtbf: 0, availability: 100, totalBreakdowns: 0 };
    }

    let totalRepairTimeMs = 0;
    let totalDowntimeMs = 0;

    actualBreakdowns.forEach(event => {
      totalRepairTimeMs += differenceInMilliseconds(new Date(event.repair_end!), new Date(event.repair_start!));
      totalDowntimeMs += differenceInMilliseconds(new Date(event.breakdown_end!), new Date(event.breakdown_start));
    });

    const totalUptimeMs = Math.max(0, analysisPeriodMs - totalDowntimeMs);
    const mttr = (totalRepairTimeMs / count) / (1000 * 60 * 60);
    const mtbf = (totalUptimeMs / count) / (1000 * 60 * 60);
    const availability = (totalUptimeMs / (totalUptimeMs + totalDowntimeMs)) * 100;

    return {
      mttr: parseFloat(mttr.toFixed(2)),
      mtbf: parseFloat(mtbfHours.toFixed(2)), // correction du nom de variable
      availability: parseFloat(availability.toFixed(1)),
      totalBreakdowns: count,
    };
  }, [events, periodDays]);

  return { metrics, isLoading, error, fetchBreakdownEvents };
};