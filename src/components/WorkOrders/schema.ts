import { z } from "zod";
import {
  PRIORITES,
  TYPES_MAINTENANCE,
  STATUTS_WORK_ORDER,
} from "@/utils/constants";

export const WorkOrderSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères."),
  description: z.string().min(10, "La description est obligatoire (10 car. min)."),
  maintenance_type: z.enum(TYPES_MAINTENANCE),
  priority: z.enum(PRIORITES),
  status: z.enum(STATUTS_WORK_ORDER),
  asset_id: z.string().min(1, "Veuillez sélectionner un équipement."),
  due_date: z.date({
    required_error: "La date d'échéance est requise.",
  }),
  assigned_to: z.string().optional().nullable(),
  scheduled_today: z.boolean().default(false),
  completed_today: z.boolean().default(false),
  completion_note: z.string().optional(),
});

export type WorkOrderFormValues = z.infer<typeof WorkOrderSchema>;