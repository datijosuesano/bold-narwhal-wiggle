import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

export const useOfflineManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = async () => {
    const pending = JSON.parse(
      localStorage.getItem('pending_interventions') || '[]'
    );

    if (!pending.length) return;

    let failedItems = [];

    showSuccess(
      `Synchronisation de ${pending.length} intervention(s)...`
    );

    for (const item of pending) {
      const { error } = await supabase
        .from('interventions')
        .insert(item);

      if (error) {
        failedItems.push(item);
      }
    }

    // On conserve uniquement les échecs
    localStorage.setItem(
      'pending_interventions',
      JSON.stringify(failedItems)
    );

    if (failedItems.length > 0) {
      showError(
        `${failedItems.length} intervention(s) non synchronisée(s)`
      );
    } else {
      showSuccess("Toutes les données sont synchronisées !");
    }
  };

  const saveOfflineIntervention = (data: any) => {
    const pending = JSON.parse(
      localStorage.getItem('pending_interventions') || '[]'
    );

    pending.push({
      ...data,
      savedAt: new Date().toISOString()
    });

    localStorage.setItem(
      'pending_interventions',
      JSON.stringify(pending)
    );

    showSuccess("Intervention enregistrée hors ligne");
  };

  return {
    isOnline,
    saveOfflineIntervention,
    syncData
  };
};