import { supabase } from "@/integrations/supabase/client";

export const technicianService = {
  // Utilisé par TechniciansTable
  async getAllTechnicians() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, specialty, role, phone, email, last_login");
    if (error) throw error;
    return data;
  },

  // Utilisé par EditTechnicianForm
  async updateTechnician(id: string, payload: any) {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        telephone: payload.telephone,
        specialite: payload.specialite,
        role: payload.role
      })
      .eq("id", id);
    if (error) throw error;
    return data;
  },

  async deleteTechnician(id: string) {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) throw error;
    return true;
  }
};