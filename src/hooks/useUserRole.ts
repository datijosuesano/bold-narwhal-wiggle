import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.technicien biomedical) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (!error && data) {
        setRole(data.role);
      }

      setLoading(false);
    };

    getRole();
  }, []);

  return { role, loading };
};