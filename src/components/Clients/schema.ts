import * as z from "zod";

export const ClientSchema = z.object({
  name: z.string().min(3, "Le nom du site est requis"),
  address: z.string().min(5, "L'adresse est requise"),
  city: z.string().min(2, "La ville est requise"),
  contactName: z.string().min(2, "Le nom du contact est requis"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
});

export type ClientFormValues = z.infer<typeof ClientSchema>;