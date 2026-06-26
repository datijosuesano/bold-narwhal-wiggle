"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const InterventionSchema = z.object({
  rit_number: z.string().min(1, "RIT requis"),
  title: z.string().min(3, "Titre trop court"),
  description: z.string().min(5, "Détaillez les travaux"),
  maintenance_type: z.string().min(1, "Type requis"),
  asset_id: z.string().min(1, "Équipement requis"),
  technician_id: z.string().min(1, "Technicien requis"),
  start_date: z.string().min(1, "Date début requise"),
  end_date: z.string().min(1, "Date fin requise"),
  total_cost: z.coerce.number().min(0),
  intervention_place: z.enum(["Sur Site", "Atelier / Service Technique"]),
});

const AddPastInterventionForm: React.FC<{ initialData?: any; onSuccess: () => void; }> = ({ initialData, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm<z.infer<typeof InterventionSchema>>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      rit_number: initialData?.rit_number || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      maintenance_type: initialData?.maintenance_type || "Corrective",
      asset_id: initialData?.asset_id || "",
      technician_id: initialData?.technician_id || user?.id || "",
      start_date: initialData?.start_date ? new Date(initialData.start_date).toISOString().slice(0, 16) : "",
      end_date: initialData?.end_date ? new Date(initialData.end_date).toISOString().slice(0, 16) : "",
      total_cost: initialData?.total_cost || 0,
      intervention_place: initialData?.intervention_place || "Sur Site",
    },
  });

  const onSubmit = async (data: z.infer<typeof InterventionSchema>) => {
    setIsLoading(true);
    const payload = { ...data, user_id: user?.id, intervention_date: data.start_date.split('T')[0] };

    try {
      if (initialData?.id) {
        // --- MODIFICATION ---
        const { error } = await supabase.from('interventions').update(payload).eq('id', initialData.id);
        if (error) throw error;
        showSuccess("Mise à jour réussie !");
      } else {
        // --- CRÉATION ---
        const { error } = await supabase.from('interventions').insert(payload);
        if (error) throw error;
        showSuccess("Enregistrement réussi !");
      }
      onSuccess();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="rit_number" render={({ field }) => (
          <FormItem><FormLabel>N° RIT</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Objet</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : "Enregistrer"}</Button>
      </form>
    </Form>
  );
};

export default AddPastInterventionForm;