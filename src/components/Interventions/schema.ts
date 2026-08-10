import { z } from "zod";

export const InterventionSchema = z.object({
  // Etape 1 : Infos Générales
  rit_number: z.string().optional(),
  physical_rit_number: z.string().optional(),
  asset_id: z.string().min(1, "L'équipement est requis"),
  intervention_place: z.string().optional(),
  title: z.string().min(1, "L'objet de l'intervention est requis"),
  maintenance_type: z.string().optional(),
  intervention_status: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  intervention_date: z.string().optional(),

  // Etape 2 : Détails techniques
  diagnosis: z.string().optional(),
  work_performed: z.string().optional(),
  description: z.string().optional(), // Notes générales
  recommendations: z.string().optional(),
  accessories_received: z.string().optional(),
  downtime_minutes: z.preprocess((val) => (val ? Number(val) : 0), z.number().optional()),

  // Etape 4 : Facturation & Administratif
  invoice_number: z.string().optional(),
  invoice_status: z.string().optional(),
  invoice_deposited_at: z.string().optional(),
  total_cost: z.preprocess((val) => (val ? Number(val) : 0), z.number().optional()),
  client_signature_url: z.string().optional(),
});

export type InterventionFormValues = z.infer<typeof InterventionSchema>;