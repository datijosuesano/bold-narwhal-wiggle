import { supabase } from "@/integrations/supabase/client";

import type {
  Intervention,
  InterventionCreateInput,
  InterventionUpdateInput,
  InterventionPart,
  InterventionAttachment,
  Technician,
  SparePart,
  SelectedPart,
} from "./types";

export const interventionService = {
  /* =========================================================
      INTERVENTIONS
  ========================================================= */

  async getAll(): Promise<Intervention[]> {
    const { data, error } = await supabase
      .from("interventions")
      .select(`
        *,
        assets(
          id,
          name,
          location
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Intervention[];
  },

  async getById(id: string): Promise<Intervention> {
    const { data, error } = await supabase
      .from("interventions")
      .select(`
        *,
        assets(
          id,
          name,
          location
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Intervention;
  },

  async create(intervention: InterventionCreateInput): Promise<Intervention> {
    const { data, error } = await supabase
      .from("interventions")
      .insert(intervention)
      .select()
      .single();

    if (error) throw error;
    return data as Intervention;
  },

  async update(id: string, updates: InterventionUpdateInput): Promise<Intervention> {
    const { data, error } = await supabase
      .from("interventions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Intervention;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("interventions")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  /* =========================================================
      EQUIPEMENTS (ASSETS)
  ========================================================= */

  async getAssets(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from("assets")
      .select("id, name")
      .order("name");

    if (error) throw error;
    return data ?? [];
  },

  /* =========================================================
      TECHNICIENS
  ========================================================= */

  async getTechnicians(): Promise<Technician[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        first_name,
        last_name,
        role
      `)
      .in("role", ["admin", "technicien_biomedical"])
      .order("first_name");

    if (error) throw error;

    return (data ?? []).map((tech) => ({
      id: tech.id,
      first_name: tech.first_name,
      last_name: tech.last_name,
      role: tech.role,
      full_name: `${tech.first_name ?? ""} ${tech.last_name ?? ""}`.trim(),
    }));
  },

  async getTechnician(id: string): Promise<Technician | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        first_name,
        last_name
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      full_name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
    };
  },

  /* =========================================================
      PIECES DETACHEES (STOCK)
  ========================================================= */

  async getSpareParts(): Promise<SparePart[]> {
    const { data, error } = await supabase
      .from("spare_parts")
      .select(`
        id,
        name,
        reference,
        current_stock,
        purchase_cost,
        min_stock,
        supplier,
        location,
        compatible_equipment
      `)
      .order("name");

    if (error) throw error;
    return (data ?? []) as SparePart[];
  },

  /* =========================================================
      PIECES D'INTERVENTION
  ========================================================= */

  async getParts(interventionId: string): Promise<InterventionPart[]> {
    const { data, error } = await supabase
      .from("intervention_parts")
      .select("*")
      .eq("intervention_id", interventionId);

    if (error) throw error;
    return (data ?? []) as InterventionPart[];
  },

  async getPartsWithDetails(interventionId: string) {
    const { data, error } = await supabase
      .from("intervention_parts")
      .select(`
        id,
        quantity,
        part_id,
        spare_parts!intervention_parts_part_id_fkey(
          id,
          name,
          reference,
          purchase_cost
        )
      `)
      .eq("intervention_id", interventionId);

    if (error) throw error;
    return data ?? [];
  },

  /* =========================================================
      PIECES JOINTES
  ========================================================= */

  async getAttachments(interventionId: string) {
    const { data, error } = await supabase
      .from("intervention_attachments")
      .select("*")
      .eq("intervention_id", interventionId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async addAttachmentMetadata(attachment: InterventionAttachment): Promise<InterventionAttachment> {
    const { data, error } = await supabase
      .from("intervention_attachments")
      .insert(attachment)
      .select()
      .single();

    if (error) throw error;
    return data as InterventionAttachment;
  },

  async deleteAttachment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("intervention_attachments")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  /* =========================================================
      LOGIQUE METIER COMBINEE
  ========================================================= */

  async createFullIntervention(
    payload: InterventionCreateInput,
    parts: SelectedPart[]
  ): Promise<Intervention> {
    const { data: intervention, error } = await supabase
      .from("interventions")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    if (parts && parts.length > 0) {
      const formattedParts = parts.map((part) => ({
        intervention_id: intervention.id,
        part_id: part.part_id,
        quantity: part.quantity,
      }));

      const { error: partsError } = await supabase
        .from("intervention_parts")
        .insert(formattedParts);

      if (partsError) throw partsError;

      await Promise.all(
        parts.map((part) =>
          supabase.rpc("decrease_stock", {
            part_id: part.part_id,
            qty: part.quantity,
          })
        )
      );
    }

    return intervention as Intervention;
  }
};