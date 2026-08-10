import { z } from "zod";

export const AssetSchema = z.object({
  name: z.string().min(3, "Le nom est requis"),
  description: z.string().optional().default(""),
  serial_number: z.string().min(1, "Le numéro de série est requis"),
  model: z.string().min(1, "Le modèle est requis"),
  brand: z.string().min(1, "La marque est requise"),
  manufacturer: z.string().min(1, "Le fabricant est requis"),
  client_id: z.string().min(1, "Veuillez sélectionner un client"),
  location: z.string().min(1, "La localisation (salle/bâtiment) est requise"),
  category: z.string().min(1, "La catégorie est requise"),
  status: z.string().min(1, "Le statut est requis"),
  assigned_to: z.string().optional().nullable().default("none"),
  image_url: z.string().optional().default(""),
  commissioning_date: z.date({ required_error: "La date de mise en service est requise" }),
  manufacturing_date: z.date().optional().nullable(),
  expiry_date: z.date().optional().nullable(),
  purchase_cost: z.coerce.number().min(0, "Le coût doit être positif"),
});

export type AssetFormValues = z.infer<typeof AssetSchema>;