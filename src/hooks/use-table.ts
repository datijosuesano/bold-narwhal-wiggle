import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

/**
 * Hook réutilisable pour récupérer les données d'une table Supabase.
 * @param tableName Nom de la table dans la base de données
 * @param orderBy Colonne pour le tri (optionnel)
 * @param ascending Ordre du tri (défaut: true)
 */
export function useTable<T>(
  tableName: string, 
  orderBy: string = 'created_at', 
  ascending: boolean = false
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: result, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .order(orderBy, { ascending });

      if (fetchError) {
        throw fetchError;
      }

      setData(result || []);
    } catch (err: any) {
      const message = err.message || "Erreur lors de la récupération des données";
      setError(message);
      showError(`Table ${tableName}: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, orderBy, ascending]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    data, 
    setData,
    isLoading, 
    error, 
    refetch: fetchData 
  };
}