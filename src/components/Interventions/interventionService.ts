import { supabase } from "@/integrations/supabase/client";

/* =========================================================
   TYPES SIMPLIFIÉS (alignés DB)
========================================================= */

export interface InterventionPart {
  id?: string;
  intervention_id?: string;
  spare_part_id: string;
  quantity: number;
  unit_cost?: number;
}

export interface InterventionAttachment {
  id?: string;
  intervention_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  created_at?: string;
}

export interface Intervention {
  id?: string;
  title: string;
  description?: string;
  asset_id?: string;
  technician_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

/* =========================================================
   INTERVENTIONS
========================================================= */

export const interventionService = {
  /* -----------------------------
     GET ALL INTERVENTIONS
  ----------------------------- */
  async getAll() {
    const { data, error } = await supabase
      .from("interventions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  /* -----------------------------
     GET ONE INTERVENTION FULL
  ----------------------------- */
  async getById(id: string) {
    const { data, error } = await supabase
      .from("interventions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  /* -----------------------------
     CREATE INTERVENTION
  ----------------------------- */
  async create(intervention: Intervention) {
    const { data, error } = await supabase
      .from("interventions")
      .insert([intervention])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /* -----------------------------
     UPDATE INTERVENTION
  ----------------------------- */
  async update(id: string, updates: Partial<Intervention>) {
    const { data, error } = await supabase
      .from("interventions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /* -----------------------------
     DELETE INTERVENTION
  ----------------------------- */
  async delete(id: string) {
    const { error } = await supabase
      .from("interventions")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  /* =========================================================
     PARTS (PIÈCES UTILISÉES)
  ========================================================= */

  async getParts(interventionId: string) {
    const { data, error } = await supabase
      .from("intervention_parts")
      .select("*")
      .eq("intervention_id", interventionId);

    if (error) throw error;
    return data;
  },

  async addPart(part: InterventionPart) {
    const { data, error } = await supabase
      .from("intervention_parts")
      .insert([part])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePart(id: string) {
    const { error } = await supabase
      .from("intervention_parts")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  /* =========================================================
     ATTACHMENTS (METADATA UNIQUEMENT)
     ⚠️ Upload géré ailleurs (InterventionAttachmentsManager)
  ========================================================= */

  async getAttachments(interventionId: string) {
    const { data, error } = await supabase
      .from("intervention_attachments")
      .select("*")
      .eq("intervention_id", interventionId);

    if (error) throw error;
    return data;
  },

  async addAttachmentMetadata(attachment: InterventionAttachment) {
    const { data, error } = await supabase
      .from("intervention_attachments")
      .insert([attachment])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAttachment(id: string) {
    const { error } = await supabase
      .from("intervention_attachments")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  /* =========================================================
     SPARE PARTS (CORRIGÉ SELON TES COLONNES)
  ========================================================= */

  async getSpareParts() {
    const { data, error } = await supabase
      .from("spare_parts")
      .select(`
        id,
        name,
        reference,
        current_stock,
        purchase_cost,
        min_stock,
        location,
        supplier,
        compatible_equipment,
        created_at
      `);

    if (error) throw error;
    return data;
  }
};

async createFullIntervention(payload: any, parts: any[]) {
  const { data: intervention, error } = await supabase
    .from("interventions")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  if (parts?.length) {
    const formattedParts = parts.map(p => ({
      intervention_id: intervention.id,
      part_id: p.part_id,
      quantity: p.quantity,
    }));

    const { error: partsError } = await supabase
      .from("intervention_parts")
      .insert(formattedParts);

    if (partsError) throw partsError;

    // batch RPC (MEILLEUR)
    await Promise.all(
      parts.map(p =>
        supabase.rpc("decrease_stock", {
          part_id: p.part_id,
          qty: p.quantity,
        })
      )
    );
  }

  return intervention;
}

async updateFullIntervention(
  interventionId: string,
  payload: any,
  newParts: any[]
) {
  // 1. récupérer anciens items
  const { data: oldParts, error: oldError } = await supabase
    .from("intervention_parts")
    .select("part_id, quantity")
    .eq("intervention_id", interventionId);

  if (oldError) throw oldError;

  // 2. update intervention d'abord
  const { error: updateError } = await supabase
    .from("interventions")
    .update(payload)
    .eq("id", interventionId);

  if (updateError) throw updateError;

  // 3. delete anciens parts
  const { error: deleteError } = await supabase
    .from("intervention_parts")
    .delete()
    .eq("intervention_id", interventionId);

  if (deleteError) throw deleteError;

  // 4. restore stock (batch)
  if (oldParts?.length) {
    await Promise.all(
      oldParts.map(p =>
        supabase.rpc("increase_stock", {
          part_id: p.part_id,
          qty: p.quantity,
        })
      )
    );
  }

  // 5. insert new parts
  if (newParts?.length) {
    const formatted = newParts.map(p => ({
      intervention_id: interventionId,
      part_id: p.part_id,
      quantity: p.quantity,
    }));

    const { error: insertError } = await supabase
      .from("intervention_parts")
      .insert(formatted);

    if (insertError) throw insertError;

    await Promise.all(
      newParts.map(p =>
        supabase.rpc("decrease_stock", {
          part_id: p.part_id,
          qty: p.quantity,
        })
      )
    );
  }

  return true;
};
  /* ================= 3. UPDATE INTERVENTION ================= */

  const { error: updateError } = await supabase
    .from("interventions")
    .update(payload)
    .eq("id", interventionId);

  if (updateError) throw updateError;

  /* ================= 4. DELETE OLD PARTS ================= */

  const { error: deleteError } = await supabase
    .from("intervention_parts")
    .delete()
    .eq("intervention_id", interventionId);

  if (deleteError) throw deleteError;

  /* ================= 5. INSERT NEW PARTS ================= */

  if (newParts?.length) {
    const formatted = newParts.map((p) => ({
      intervention_id: interventionId,
      spare_part_id: p.part_id,
      quantity: p.quantity,
    }));

    const { error: insertError } = await supabase
      .from("intervention_parts")
      .insert(formatted);

    if (insertError) throw insertError;

    /* ================= 6. DECREASE NEW STOCK ================= */

    for (const p of newParts) {
      await supabase.rpc("decrease_stock", {
        part_id: p.part_id,
        qty: p.quantity,
      });
    }
  }

  return true;
}