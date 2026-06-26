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
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const InterventionSchema = z.object({
  rit_number: z.string().min(1, "RIT requis"),
  title: z.string().min(3, "Titre trop court"),
  description: z.string().min(5, "Détaillez les travaux"),
});

const AddPastInterventionForm: React.FC<{ initialData?: any; onSuccess: () => void; }> = ({ initialData, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      rit_number: initialData?.rit_number || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    const payload = { ...data, user_id: user?.id };

    try {
      if (initialData?.id) {
        // MODIFICATION : Mise à jour de la ligne existante
        const { error } = await supabase.from('interventions').update(payload).eq('id', initialData.id);
        if (error) throw error;
        showSuccess("Mise à jour réussie !");
      } else {
        // CRÉATION : Nouvelle ligne
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
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Détails</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
        )} />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="animate-spin" /> : "Enregistrer"}
        </Button>
      </form>
    </Form>
  );
};

export default AddPastInterventionForm;