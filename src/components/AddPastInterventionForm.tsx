"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  // Champs techniques supplémentaires
  client_signature_url: z.string().optional(),
});

type InterventionFormValues = z.infer<typeof InterventionSchema>;

const AddPastInterventionForm: React.FC<{ initialData?: any; onSuccess: () => void }> = ({ initialData, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      rit_number: initialData?.rit_number || "",
      physical_rit_number: initialData?.physical_rit_number || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      maintenance_type: initialData?.maintenance_type || "Corrective",
      asset_id: initialData?.asset_id || "",
      technician_id: initialData?.technician_id || user?.id || "",
      start_date: initialData?.start_date ? initialData.start_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
      end_date: initialData?.end_date ? initialData.end_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
      total_cost: initialData?.total_cost || 0,
      intervention_place: initialData?.intervention_place || "Sur Site",
      invoice_number: initialData?.invoice_number || "",
      invoice_status: initialData?.invoice_status || "Non facturé",
      invoice_deposited_at: initialData?.invoice_deposited_at ? initialData.invoice_deposited_at.slice(0, 16) : "",
      accessories_received: initialData?.accessories_received || "",
      parts_replaced: initialData?.parts_replaced || false,
      client_signature_url: initialData?.client_signature_url || "",
    },
  });

  const onSubmit = async (data: InterventionFormValues) => {
    setIsLoading(true);
    const payload = { ...data, user_id: user?.id || null };
    
    const { error } = initialData?.id 
      ? await supabase.from("interventions").update(payload).eq("id", initialData.id)
      : await supabase.from("interventions").insert(payload);

    if (error) showError(error.message);
    else { showSuccess("Sauvegardé !"); onSuccess(); }
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-4">
        {/* IDENTIFICATION */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="rit_number" render={({ field }) => <FormItem><FormLabel>N° RIT</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
          <FormField control={form.control} name="physical_rit_number" render={({ field }) => <FormItem><FormLabel>N° Physique</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
        </div>

        {/* TRAVAUX */}
        <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel>Objet</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
        <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>} />

        {/* FACTURATION */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="invoice_number" render={({ field }) => <FormItem><FormLabel>N° Facture</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
          <FormField control={form.control} name="invoice_status" render={({ field }) => <FormItem><FormLabel>Statut</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Facturé">Facturé</SelectItem><SelectItem value="Non facturé">Non facturé</SelectItem></SelectContent></Select></FormItem>} />
        </div>

        <FormField control={form.control} name="invoice_deposited_at" render={({ field }) => <FormItem><FormLabel>Date dépôt facture</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl></FormItem>} />

        {/* DÉTAILS TECHNIQUES */}
        <FormField control={form.control} name="parts_replaced" render={({ field }) => <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Pièces remplacées</FormLabel></FormItem>} />
        <FormField control={form.control} name="accessories_received" render={({ field }) => <FormItem><FormLabel>Accessoires reçus</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>} />

        <Button type="submit" className="w-full bg-blue-600" disabled={isLoading}>{isLoading ? "..." : "Enregistrer les 21 champs"}</Button>
      </form>
    </Form>
  );
};

export default AddPastInterventionForm;