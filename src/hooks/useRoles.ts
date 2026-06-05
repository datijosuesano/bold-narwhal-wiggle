import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Role {
  id: string;
  name: string;
  label: string;
  color: string;
}

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('label');

      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des rôles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return { roles, isLoading, refetch: fetchRoles };
};