import { z } from "zod";

export const TechnicianSchema = z.object({
  first_name: z
    .string()
    .min(2, "Le prénom est obligatoire"),

  last_name: z
    .string()
    .min(2, "Le nom est obligatoire"),

  phone: z
    .string()
    .optional(),

  email: z
    .string()
    .email("Email invalide")
    .optional()
    .or(z.literal("")),

  specialty: z
    .string()
    .optional(),

  is_active: z
    .boolean()
    .default(true),
});


export type TechnicianFormValues =
  z.infer<typeof TechnicianSchema>;