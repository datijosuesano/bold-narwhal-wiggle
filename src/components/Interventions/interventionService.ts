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