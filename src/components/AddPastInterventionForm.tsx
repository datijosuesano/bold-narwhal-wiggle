"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, CheckCircle2, Plus, Trash2, Box } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import InterventionAttachmentsManager from "./InterventionAttachmentsManager";

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
  const [assets, setAssets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [selectedParts, setSelectedParts] = useState<{partId: string, quantity: number}[]>([]);
  const [savedInterventionId, setSavedInterventionId] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchData = async () => {
      const { data: a } = await supabase.from('assets').select('id, name, location').order('name');
      const { data: t } = await supabase.from('profiles').select('id, first_name, last_name');
      const { data: p } = await supabase.from('spare_parts').select('id, name, reference, current_stock');
      setAssets(a || []); setTechnicians(t || []); setSpareParts(p || []);
      
      // Si modification, charger les pièces déjà liées
      if (initialData?.id) {
        const { data: parts } = await supabase.from('intervention_parts').select('*').eq('intervention_id', initialData.id);
        setSelectedParts((parts || []).map(p => ({ partId: p.part_id, quantity: p.quantity })));
      }
    };
    fetchData();
  }, [initialData]);

  const onSubmit = async (data: z.infer<typeof InterventionSchema>) => {
    setIsLoading(true);
    const payload = { ...data, user_id: user?.id, intervention_date: data.start_date.split('T')[0] };

    try {
      let interventionId = initialData?.id;

      if (initialData?.id) {
        // --- MODIFICATION ---
        await supabase.from('interventions').update(payload).eq('id', initialData.id);
        await supabase.from('intervention_parts').delete().eq('intervention_id', initialData.id);
      } else {
        // --- CRÉATION ---
        const { data: newInv, error } = await supabase.from('interventions').insert(payload).select('id').single();
        if (error) throw error;
        interventionId = newInv.id;
      }

      // Enregistrement des pièces
      for (const part of selectedParts) {
        await supabase.from('intervention_parts').insert({ 
            intervention_id: interventionId, part_id: part.partId, quantity: part.quantity 
        });
      }

      setSavedInterventionId(interventionId);
      showSuccess("Intervention enregistrée !");
      if (!initialData?.id) onSuccess();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!savedInterventionId ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <FormField control={form.control} name="rit_number" render={({ field }) => (
              <FormItem><FormLabel>N° RIT</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="asset_id" render={({ field }) => (
                <FormItem><FormLabel>Équipement</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="maintenance_type" render={({ field }) => (
                <FormItem><FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="Corrective">Corrective</SelectItem><SelectItem value="Préventive">Préventive</SelectItem></SelectContent></Select>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Objet</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Détails</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
            )} />

            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Enregistrement..." : "Enregistrer"}</Button>
          </form>
        </Form>
      ) : (
        <div className="text-center p-6">
          <CheckCircle2 className="mx-auto text-green-500 mb-4" size={48} />
          <p>Intervention enregistrée avec succès.</p>
          <InterventionAttachmentsManager interventionId={savedInterventionId} userId={user?.id} />
          <Button onClick={onSuccess} className="mt-4 w-full">Terminer</Button>
        </div>
      )}
    </div>
  );
};

export default AddPastInterventionForm;