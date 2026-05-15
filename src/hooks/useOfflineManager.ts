import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

export const useOfflineManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = async () => {
    const pending = JSON.parse(localStorage.getItem('pending_interventions') || '[]');
    if (pending.length === 0) return;

    showSuccess(`Synchronisation de ${pending.length} intervention(s)...`);

    for (const item of pending) {
      const { error } = await supabase.from('interventions').insert(item);
      if (error) {
        showError("Erreur de synchro pour une intervention.");
      }
    }

    localStorage.removeItem('pending_interventions');
    showSuccess("Toutes les données sont à jour !");
  };

  const saveOfflineIntervention = (data: any) => {
    const pending = JSON.parse(localStorage.getItem('pending_interventions') || '[]');
    pending.push(data);
    localStorage.setItem('pending_interventions', JSON.stringify(pending));
    showSuccess("Enregistré localement (Mode Offline)");
  };

  return { isOnline, saveOfflineIntervention };
};