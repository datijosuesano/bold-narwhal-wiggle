import { supabase } from "@/integrations/supabase/client";

export const partService = {
  async createPart(partData: any, userId: string) {
    const { data, error } = await supabase.from('spare_parts').insert({
      user_id: userId,
      name: partData.name,
      reference: partData.reference,
      current_stock: partData.quantity,
      min_stock: partData.minQuantity,
      purchase_cost: partData.purchaseCost,
      location: partData.location,
      supplier: partData.supplier,
      compatible_equipment: partData.compatible_equipment,
    });
    if (error) throw error;
    return data;
  },

  async getAllParts() {
    const { data, error } = await supabase.from('spare_parts').select('*').order('name');
    if (error) throw error;
    return data;
  }, // <--- N'oublie pas cette virgule ici !

  async updatePart(id: string, partData: any) {
    const { data, error } = await supabase
      .from('spare_parts')
      .update({
        name: partData.name,
        reference: partData.reference,
        current_stock: partData.quantity,
        min_stock: partData.minQuantity,
        purchase_cost: partData.purchaseCost,
        location: partData.location,
        category: partData.category,
        supplier: partData.supplier,
        compatible_equipment: partData.compatible_equipment,
      })
      .eq('id', id);
      
    if (error) throw error;
    return data;
  }
};