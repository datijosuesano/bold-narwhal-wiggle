"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";

import {
  createIntervention,
  updateIntervention,
} from "@/interventionService";

const InterventionSchema = z.object({
  rit_number: z.string(),
  physical_rit_number: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  maintenance_type: z.string(),
  asset_id: z.string().optional(),
  technician_id: z.string().optional(),
  start_date: z.string(),
  end_date: z.string(),
  total_cost: z.coerce.number(),
  intervention_place: z.string().optional(),
  invoice_number: z.string().optional(),
  invoice_status: z.string().optional(),
  invoice_deposited_at: z.string().optional(),
  accessories_received: z.string().optional(),
  parts_replaced: z.boolean().optional(),
  client_signature_url: z.string().optional(),
});

type InterventionFormValues = z.infer<typeof InterventionSchema>;

const AddPastInterventionForm: React.FC<{
  initialData?: any;
  onSuccess: () => void;
}> = ({ initialData, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      rit_number: "",
      physical_rit_number: "",
      title: "",
      description: "",
      maintenance_type: "Corrective",
      asset_id: "",
      technician_id: user?.id || "",
      start_date: new Date().toISOString().slice(0, 16),
      end_date: new Date().toISOString().slice(0, 16),
      total_cost: 0,
      intervention_place: "Sur Site",
      invoice_number: "",
      invoice_status: "Non facturé",
      invoice_deposited_at: "",
      accessories_received: "",
      parts_replaced: false,
      client_signature_url: "",
    },
  });

  useEffect(() => {
    if (!initialData) return;

    form.reset({
      ...initialData,
      start_date: initialData.start_date?.slice(0, 16),
      end_date: initialData.end_date?.slice(0, 16),
      invoice_deposited_at: initialData.invoice_deposited_at?.slice(0, 16),
    });
  }, [initialData, form]);

  const onSubmit = async (data: InterventionFormValues) => {
    setIsLoading(true);

    try {
      const payload = {
        ...data,
        user_id: user?.id || null,
      };

      if (initialData?.id) {
        await updateIntervention(initialData.id, payload);
      } else {
        await createIntervention(payload);
      }

      showSuccess("Sauvegardé !");
      onSuccess();

    } catch (error: any) {
      showError(error.message || "Erreur");

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">

        <FormField control={form.control} name="rit_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RIT</FormLabel>
              <FormControl><Input {...field} /></FormControl>
            </FormItem>
          )}
        />

        <FormField control={form.control} name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objet</FormLabel>
              <FormControl><Input {...field} /></FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "..." : "Enregistrer"}
        </Button>

      </form>
    </Form>
  );
};

export default AddPastInterventionForm;