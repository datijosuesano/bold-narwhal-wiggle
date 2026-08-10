import { z } from "zod";

export const PartSchema = z.object({
  name: z.string().min(3, "Le nom est requis"),
  reference: z.string().min(3, "La référence est requise"),
  quantity: z.coerce.number().min(0, "Le stock doit être positif"),
  minQuantity: z.coerce.number().min(0, "Le seuil doit être positif"),
  purchaseCost: z.coerce.number().min(0, "Le coût doit être positif"),
  location: z.string().min(1, "La localisation est requise"),
  supplier: z.string().optional().default(""),
  compatible_equipment: z.string().optional().default(""),
});

export type PartFormValues = z.infer<typeof PartSchema>;