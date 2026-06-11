import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();

        if (!userData?.user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .single();

        if (error) {
          // Ce log indispensable va vous dire précisément dans la console F12 pourquoi le rôle n'est pas lu
          console.error("Erreur Supabase RLS ou Colonne sur 'profiles':", error.message);
          setRole("non_autorise"); 
        } else if (data) {
          setRole(data.role);
        }
      } catch (err) {
        console.error("Erreur critique getRole:", err);
      } finally {
        setLoading(false);
      }
    };

    getRole();
  }, []);

  return { role, loading };
};