import { supabase } from "@/integrations/supabase/client";
import type { InterventionAttachment } from "./types";


import { 
  Intervention,
  InterventionCreateInput,
  InterventionUpdateInput,
  InterventionPart,
  InterventionPartInput,
  Asset,
  Technician,
  SparePart,
} from "./types";

/* =========================================================
   LOOKUPS (READ ONLY DATA)
========================================================= */

export async function getAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from("assets")
    .select("id, name, location")
    .order("name");

  if (error) throw error;
  return data || [];
}

export async function getTechnicians(): Promise<Technician[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .order("first_name");

  if (error) throw error;
  return data || [];
}

export async function getParts(): Promise<SparePart[]> {
  const { data, error } = await supabase
    .from("spare_parts")
    .select("id, name, stock, price")
    .order("name");

  if (error) throw error;
  return data || [];
}

/* =========================================================
   INTERVENTIONS QUERY
========================================================= */

export async function getInterventions(): Promise<Intervention[]> {
  const { data, error } = await supabase
    .from("interventions")
    .select("*, assets(name, location)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getInterventionById(
  id: string
): Promise<Intervention | null> {
  const { data, error } = await supabase
    .from("interventions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/* =========================================================
   INTERVENTIONS CRUD
========================================================= */

export async function createIntervention(
  payload: InterventionCreateInput
): Promise<Intervention> {
  const { data, error } = await supabase
    .from("interventions")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateIntervention(
  id: string,
  payload: InterventionUpdateInput
): Promise<Intervention> {
  const { data, error } = await supabase
    .from("interventions")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteIntervention(id: string): Promise<void> {
  const { error: partsError } = await supabase
    .from("intervention_parts")
    .delete()
    .eq("intervention_id", id);

  if (partsError) throw partsError;

  const { error: attachmentsError } = await supabase
    .from("intervention_attachments")
    .delete()
    .eq("intervention_id", id);

  if (attachmentsError) throw attachmentsError;

  const { error } = await supabase
    .from("interventions")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* =========================================================
   INTERVENTION PARTS
========================================================= */

export async function saveInterventionParts(
  interventionId: string,
  parts: InterventionPartInput[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("intervention_parts")
    .delete()
    .eq("intervention_id", interventionId);

  if (deleteError) throw deleteError;

  if (parts.length === 0) return;

  const rows = parts.map((p) => ({
    intervention_id: interventionId,
    part_id: p.partId,
    quantity: p.quantity,
  }));

  const { error } = await supabase
    .from("intervention_parts")
    .insert(rows);

  if (error) throw error;
}

/* ================================
   GET PARTS USED IN INTERVENTION
================================ */

export async function getInterventionParts(interventionId: string) {
  const { data, error } = await supabase
    .from("intervention_parts")
    .select("*, spare_parts(*)")
    .eq("intervention_id", interventionId);

  if (error) throw error;
  return data;
}

/* ================================
   SAVE PARTS (CORE LOGIC)
================================ */

export async function saveInterventionParts(
  interventionId: string,
  parts: { part_id: string; quantity: number }[]
) {
  // 1. delete old
  const { error: delError } = await supabase
    .from("intervention_parts")
    .delete()
    .eq("intervention_id", interventionId);

  if (delError) throw delError;

  if (!parts.length) return;

  // 2. insert new
  const rows: InterventionPart[] = parts.map((p) => ({
    intervention_id: interventionId,
    part_id: p.part_id,
    quantity: p.quantity,
  }));

  const { error } = await supabase
    .from("intervention_parts")
    .insert(rows);

  if (error) throw error;
}

/* ================================
   UPDATE STOCK AUTOMATICALLY
================================ */

export async function decrementPartsStock(
  parts: { part_id: string; quantity: number }[]
) {
  for (const p of parts) {
    // get current stock
    const { data, error } = await supabase
      .from("spare_parts")
      .select("stock_quantity")
      .eq("id", p.part_id)
      .single();

    if (error) throw error;

    const newStock = (data?.stock_quantity || 0) - p.quantity;

    if (newStock < 0) {
      throw new Error("Stock insuffisant pour une pièce");
    }

    const { error: updateError } = await supabase
      .from("spare_parts")
      .update({ stock_quantity: newStock })
      .eq("id", p.part_id);

    if (updateError) throw updateError;
  }
}

export async function getInterventionAttachments(interventionId: string) {
  const { data, error } = await supabase
    .from("intervention_attachment")
    .select("*")
    .eq("intervention_id", interventionId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as InterventionAttachment[];
}

export async function uploadInterventionFile(file: File) {
  const filePath = `interventions/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("intervention-files")
    .upload(filePath, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("intervention-files")
    .getPublicUrl(filePath);

  return {
    name: file.name,
    file_url: data.publicUrl,
    file_type: file.type,
  };
}


export async function saveInterventionAttachment(
  payload: Omit<InterventionAttachment, "id" | "created_at">
) {
  const { data, error } = await supabase
    .from("intervention_attachment")
    .insert({
      ...payload,
      user_id: payload.user_id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInterventionAttachment(id: string) {
  const { error } = await supabase
    .from("intervention_attachment")
    .delete()
    .eq("id", id);

  if (error) throw error;
}