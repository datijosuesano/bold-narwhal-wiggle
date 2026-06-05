import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

export interface WorkOrder {
  id: string;
  title: string;
  description: string | null;
  asset_id: string;
  priority: string;
  status: string;
  due_date: string;
  created_at: string;
  maintenance_type: string;
  assigned_to: string | null;
  intervention_id: string | null;
  technician_name?: string | null;
  assets: {
    name: string;
    serial_number: string | null;
    location: string;
  } | null;
}

export interface Technician {
  id: string;
  name: string;
}

export interface Intervention {
  id: string;
  rit_number?: string | null;
  title: string;
  maintenance_type: string;
  intervention_date: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  description: string;
  asset_id: string;
  invoice_status: string;
  invoice_number: string;
  intervention_place: string;
  accessories_received?: string | null;
  client_signature_url?: string | null;
  technician_id?: string | null;
  user_id?: string | null;
  invoice_deposited_at?: string | null;
  assets: {
    name: string;
    location: string;
    brand?: string | null;
  } | null;
}

export const useWorkOrders = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [linkedIntervention, setLinkedIntervention] = useState<Intervention | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [woResponse, techResponse] = await Promise.all([
        supabase
          .from('work_orders')
          .select('*, assets(name, serial_number, location)')
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .order('last_name')
      ]);

      if (woResponse.error) throw woResponse.error;
      if (techResponse.error) throw techResponse.error;

      const techMap = new Map<string, string>(
        (techResponse.data || []).map(t => [
          t.id,
          `${t.first_name || ''} ${t.last_name || ''}`.trim()
        ])
      );

      const formattedData: WorkOrder[] = (woResponse.data || []).map(ot => ({
        ...ot,
        technician_name: ot.assigned_to ? techMap.get(ot.assigned_to) || "Inconnu" : null,
        assets: ot.assets ? {
          name: ot.assets.name || "Équipement inconnu",
          serial_number: ot.assets.serial_number || null,
          location: ot.assets.location || "Non localisé"
        } : null
      }));

      setWorkOrders(formattedData);
      setTechnicians(
        (techResponse.data || []).map(t => ({
          id: t.id,
          name: `${t.first_name || ''} ${t.last_name || ''}`.trim()
        }))
      );
    } catch (error: any) {
      console.error("Error fetching work orders:", error);
      showError("Erreur de chargement des données.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteWorkOrder = useCallback(async (id: string) => {
    try {
      // Optimistic update
      setWorkOrders(prev => prev.filter(ot => ot.id !== id));

      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', id);

      if (error) {
        // Rollback if error
        fetchData();
        throw error;
      }

      showSuccess("Ordre de travail supprimé.");
    } catch (error: any) {
      console.error("Error deleting work order:", error);
      showError("Erreur lors de la suppression.");
    }
  }, [fetchData]);

  const fetchLinkedIntervention = useCallback(async (interventionId: string) => {
    setIsDetailLoading(true);
    try {
      const { data, error } = await supabase
        .from('interventions')
        .select('*, assets(name, location, brand)')
        .eq('id', interventionId)
        .single();

      if (error) throw error;
      setLinkedIntervention(data as Intervention);
      return data as Intervention;
    } catch (err: any) {
      console.error("Error fetching linked intervention:", err);
      showError("Impossible de charger le rapport d'intervention lié.");
      return null;
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    workOrders,
    technicians,
    isLoading,
    isDetailLoading,
    linkedIntervention,
    fetchData,
    deleteWorkOrder,
    fetchLinkedIntervention,
    setLinkedIntervention
  };
};