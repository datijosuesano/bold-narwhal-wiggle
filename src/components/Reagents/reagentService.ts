import { supabase } from "@/integrations/supabase/client";

export const reagentService = {
  /* ================= RÉACTIFS ================= */
  async getReagents() {
    const { data, error } = await supabase
      .from("lab_reagents")
      .select("*")
      .order("name");
      
    if (error) throw error;
    return data;
  },

  /* ================= MOUVEMENTS DE STOCK (AUDIT) ================= */
  async getRecentMovements(limit = 100) {
    const { data, error } = await supabase
      .from("reagent_stock_movements")
      .select("*, lab_reagents(name)")
      .order("created_at", { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data;
  },

  /* ================= DÉPENDANCES ================= */
  async getTechnicians() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name");
      
    if (error) throw error;
    return data;
  }
};