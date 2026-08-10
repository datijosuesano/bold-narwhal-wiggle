// src/components/Assets/assetService.ts
import { supabase } from "@/integrations/supabase/client";

export const assetService = {
  // AJOUTE CETTE MÉTHODE :
  async getAllAssets() {
    const { data, error } = await supabase
      .from("assets")
      .select("id, name, serial_number")
      .order("name");
    if (error) throw error;
    return data;
  },

  async getClients() {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name");
    if (error) throw error;
    return data;
  },

  async getTechnicians() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name");
    if (error) throw error;
    return data;
  },

  async createAsset(payload: any) {
    const { data, error } = await supabase
      .from("assets")
      .insert(payload);
    if (error) throw error;
    return data;
  }
};