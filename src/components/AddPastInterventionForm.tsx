"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save } from "lucide-react";
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
  physical_rit_number: z.string().optional(), // Nouveau champ pour tes archives
  title: z.string().min(3, "Titre trop court"),
  description: z.string().min(5, "Détaillez les travaux"),
  maintenance_type: z.string().min(1, "Type requis"),
  asset_id: z.string().min(1, "Équipement requis"),
  technician_id: z.string().min(1, "Technicien requis"),
  start_date: z.string().min(1, "Date début requise"),
  end_date: z.string().min(1, "Date fin requise"),
  total_cost: z.coerce.number().min(0, "Le coût doit être positif"),
  intervention_place: z.enum(["Sur Site", "Atelier / Service Technique"]),
});

type InterventionFormValues = z.infer<typeof InterventionSchema>;

interface AddPastInterventionFormProps {
  initialData?: any;
  onSuccess: () => void;
}

const AddPastInterventionForm: React.FC<AddPastInterventionFormProps> = ({ initialData, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [assets, setAssets] = useState<{ id: string; name: string; location: string }[]>([]);
  const [techs, setTechs] = useState<{ id: string; name: string }[]>([]);
  const { user } = useAuth();

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      rit_number: initialData?.rit_number || "",
      physical_rit_number: initialData?.physical_rit_number || "", // Chargement initial
      title: initialData?.title || "",
      description: initialData?.description || "",
      maintenance_type: initialData?.maintenance_type || "Corrective",
      asset_id: initialData?.asset_id || "",
      technician_id: initialData?.technician_id || user?.id || "",
      start_date: initialData?.start_date ? new Date(initialData.start_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      end_date: initialData?.end_date ? new Date(initialData.end_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      total_cost: initialData?.total_cost || 0,
      intervention_place: initialData?.intervention_place || "Sur Site",
    },
  });
  useEffect(() => {
    // Si on est en mode création (pas d'initialData), on génère le prochain numéro
    if (!initialData) {
      const generateNextRit = async () => {
        const { data } = await supabase
          .from('interventions')
          .select('rit_number')
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0 && data[0].rit_number) {
          const lastRit = data[0].rit_number; // Format attendu: "RIT-2026-001"
          const parts = lastRit.split('-');
          const lastNum = parseInt(parts[2] || "0");
          const nextNum = String(lastNum + 1).padStart(3, '0');
          form.setValue("rit_number", `RIT-2026-${nextNum}`);
        } else {
          form.setValue("rit_number", "RIT-2026-001");
        }
      };
      generateNextRit();
    }
  }, [initialData, form]); 

  const onSubmit = async (data: InterventionFormValues) => {
    setIsLoading(true);
    const payload = {
      ...data,
      user_id: user?.id || null,
      intervention_date: data.start_date.split('T')[0]
    };

    try {
      if (initialData?.id) {
        const { error } = await supabase.from("interventions").update(payload).eq("id", initialData.id);
        if (error) throw error;
        showSuccess("Intervention mise à jour !");
      } else {
        const { error } = await supabase.from("interventions").insert(payload);
        if (error) throw error;
        showSuccess("Intervention enregistrée !");
      }
      onSuccess();
    } catch (err: any) {
      showError(err.message || "Erreur de sauvegarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="rit_number" render={({ field }) => (
            <FormItem>
              <FormLabel>N° RIT (Application)</FormLabel>
              <FormControl><Input {...field} className="rounded-xl font-mono" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="physical_rit_number" render={({ field }) => (
            <FormItem>
              <FormLabel>N° RIT Physique (Rapport papier)</FormLabel>
              <FormControl><Input {...field} placeholder="Ex: 12" className="rounded-xl border-blue-200" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Objet de l'intervention</FormLabel>
            <FormControl><Input {...field} className="rounded-xl" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Détail des travaux</FormLabel>
            <FormControl><Textarea {...field} className="rounded-xl resize-none h-20" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="asset_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Équipement</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent className="rounded-xl">
                  {assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="maintenance_type" render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Corrective">Corrective</SelectItem>
                  <SelectItem value="Préventive">Préventive</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <Button type="submit" className="w-full bg-blue-600 rounded-xl h-12 mt-4" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
          {initialData ? "Sauvegarder" : "Enregistrer l'intervention"}
        </Button>
      </form>
    </Form>
  );
};

export default AddPastInterventionForm;