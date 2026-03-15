import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  role: 'admin' | 'technicien biomedical' | 'gestionnaire de stock' | 'secretaire' | 'user';
  status: string;
  created_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            setProfile(data as UserProfile);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du profil:", error);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, []);

  return { 
    profile, 
    loading, 
    isAdmin: profile?.role === 'admin',
    isTechnician: profile?.role === 'technicien biomedical'
  };
}