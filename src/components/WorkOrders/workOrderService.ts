import { supabase } from "@/integrations/supabase/client";

export const workOrderService = {
  /* ================= RÉCUPÉRATION DES DÉPENDANCES ================= */
  
  async getAssets() {
    const { data, error } = await supabase
      .from("assets")
      .select("id, name, brand, serial_number, location")
      .order("name");
      
    if (error) throw error;
    return data;
  },

  async getTechnicians() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .order("last_name");
      
    if (error) throw error;
    return data;
  },

  /* ================= CRUD ORDRES DE TRAVAIL ================= */

  async createWorkOrder(payload: any) {
    const { data, error } = await supabase
      .from("work_orders")
      .insert(payload)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async updateWorkOrder(id: string, payload: any) {
    const { data, error } = await supabase
      .from("work_orders")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }, // <--- La virgule est ici

  async getWorkOrders() {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  }, // <--- La virgule est ici

  async deleteWorkOrder(id: string) {
    const { error } = await supabase
      .from('work_orders')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  }
}; // <--- L'accolade fermante de l'objet est tout en bas