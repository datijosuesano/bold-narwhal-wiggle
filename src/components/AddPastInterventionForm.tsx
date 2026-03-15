"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle2, Save, User, FileText, Package } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import InterventionAttachmentsManager from "./InterventionAttachmentsManager";

const InterventionSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères."),
  description: z.string().min(10, "Veuillez décrire l'action menée (10 car. min)."),
  maintenance_type: z.string().min(1, "Le type est requis"),
  asset_id: z.string().min(1, "Veuillez sélectionner un équipement."),
  technician_id: z.string().min(1, "Le technicien est requis."),
  intervention_date: z.string().min(1, "La date est requise."),
  parts_replaced: z.boolean().default(false),
});

type InterventionFormValues = z.infer<typeof InterventionSchema>;

interface AddPastInterventionFormProps {
  assetId?: string;
  initialData?: any;
  onSuccess: () => void;
}

const AddPastInterventionForm: React.FC<AddPastInterventionFormProps> = ({ assetId, initialData, onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [assets, setAssets] = useState<{id: string, name: string, serial_number: string, location: string}[]>([]);
  const [technicians, setTechnicians] = useState<{id: string, first_name: string, last_name: string}[]>([]);
  const { user } = useAuth();
  const [savedInterventionId, setSavedInterventionId] = useState<string | null>(initialData?.id || null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: assetList } = await supabase.from('assets').select('id, name, serial_number, location').order('name');
      setAssets(assetList || []);

      const { data: techList } = await supabase.from('profiles').select('id, first_name, last_name').order('last_name');
      setTechnicians(techList || []);
    };
    fetchData();
  }, []);

  const onSubmit = async (data: InterventionFormValues) => {
    setIsLoading(true);

    const payload = {
      user_id: user?.id,
      technician_id: data.technician_id,
      asset_id: data.asset_id,
      title: data.title,
      description: data.description,
      maintenance_type: data.maintenance_type as any,
      intervention_date: data.intervention_date,
      parts_replaced: data.parts_replaced,
    };

    try {
      if (initialData?.id) {
        const { error } = await supabase.from('interventions').update(payload).eq('id', initialData.id);
        if (error) throw error;
        showSuccess("Intervention mise à jour !");
        onSuccess();
      } else {
        const { data: newIntervention, error } = await supabase.from('interventions').insert(payload).select('id').single();
        if (error) throw error;
        setSavedInterventionId(newIntervention.id);
        showSuccess("Intervention enregistrée ! Vous pouvez maintenant ajouter des documents.");
      }
    } catch (err: any) {
      showError(`Erreur : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="asset_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Équipement</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!!initialData || !!savedInterventionId}>
                  <FormControl><SelectTrigger className="rounded-xl h-auto py-2"><SelectValue placeholder="Choisir" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {assets.map(a => (
                      <SelectItem key={a.id} value={a.id} className="py-2">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-xs">{a.name}</span>
                          <span className="text-[9px] text-muted-foreground uppercase">SN: {a.serial_number || 'N/A'} • {a.location}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="technician_id" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><User size={14} className="mr-1" /> Technicien</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!!savedInterventionId}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                  <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Objet de l'intervention</FormLabel>
              <FormControl><Input placeholder="Ex: Réparation pompe" {...field} className="rounded-xl" disabled={!!savedInterventionId} /></FormControl>
            </FormItem>
          )} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="intervention_date" render={({ field }) => (
              <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} className="rounded-xl" disabled={!!savedInterventionId} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="maintenance_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!!savedInterventionId}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Préventive">Préventive</SelectItem>
                    <SelectItem value="Corrective">Corrective</SelectItem>
                    <SelectItem value="Curative">Curative</SelectItem>
                    <SelectItem value="Améliorative">Améliorative</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Détails des travaux</FormLabel>
              <FormControl><Textarea placeholder="Actions menées..." {...field} className="rounded-xl h-24 resize-none" disabled={!!savedInterventionId} /></FormControl>
            </FormItem>
          )} />

          {!savedInterventionId ? (
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 rounded-xl h-12 font-bold shadow-lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} 
              {initialData ? "Sauvegarder les modifications" : "Enregistrer et continuer"}
            </Button>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <InterventionAttachmentsManager interventionId={savedInterventionId} userId={user?.id} />
              <Button variant="outline" className="w-full mt-6 rounded-xl border-slate-200" onClick={onSuccess}>
                Terminer
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default AddPastInterventionForm;