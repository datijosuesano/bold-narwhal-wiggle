// src/components/Clients/clientService.ts
import { supabase } from "@/integrations/supabase/client";

export const clientService = {
  
  async getClients() {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("name");
      
    if (error) throw error;
    return data;
  },

  async createClient(data: any, userId: string) {
    const { data: result, error } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        name: data.name,
        address: data.address,
        city: data.city,
        contact_name: data.contactName,
        phone: data.phone,
        contract_status: 'None'
      });
      
    if (error) throw error;
    return result;
  },

  async updateClient(id: string, payload: any) {
    const { data, error } = await supabase
      .from('clients')
      .update({
        name: payload.name,
        address: payload.address,
        city: payload.city,
        contact_name: payload.contactName,
        phone: payload.phone,
      })
      .eq('id', id);
      
    if (error) throw error;
    return data;
  }

};