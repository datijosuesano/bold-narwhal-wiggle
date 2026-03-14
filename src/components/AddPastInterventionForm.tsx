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

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      maintenance_type: initialData?.maintenance_type || "Corrective",
      asset_id: initialData?.asset_id || assetId || "",
      technician_id: initialData?.technician_id || user?.id || "",
      intervention_date: initialData?.intervention_date || format(new Date(), "yyyy-MM-dd"),
      parts_replaced: initialData?.parts_replaced || false,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: assetList } = await supabase.from('assets').select('id, name, serial_number, location').order('name');
      setAssets(assetList || []);

      const { data: techList } = await supabase.from('profiles').select('id, first_name, last_name').eq('role', 'technician').order('last_name');
      setTechnicians(techList || []);
    };
    fetchData();
  }, []);

  const onSubmit = async (data: InterventionFormValues) => {
    setIsLoading(true);

    const payload = {
      user_id: user?.id, // Rapporteur
      technician_id: data.technician_id,
      asset_id: data.asset_id,
      title: data.title,
      description: data.description,
      maintenance_type: data.maintenance_type as any,
      intervention_date: data.intervention_date,
      parts_replaced: data.parts_replaced,
    };

    try {
      let error;
      if (initialData?.id) {
        const { error: updateError } = await supabase.from('interventions').update(payload).eq('id', initialData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('interventions').insert(payload);
        error = insertError;
      }

      if (error) throw error;

      showSuccess(initialData?.id ? "Intervention mise à jour !" : "Intervention enregistrée !");
      onSuccess();
    } catch (err: any) {
      showError(`Erreur : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="asset_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Équipement</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!!initialData}>
                <FormControl><SelectTrigger className="rounded-xl h-auto py-2"><SelectValue placeholder="Choisir" /></SelectTrigger></FormControl>
                <SelectContent>
                  {assets.map(a => (
                    <SelectItem key={a.id} value={a.id} className="py-2">
                       <div className="flex flex-col">
                        <span className="font-bold text-xs">{a.name}</span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          SN: {a.serial_number || 'N/A'} • {a.location}
                        </span>
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
              <FormLabel className="flex items-center"><User size={14} className="mr-1" /> Technicien Intervenant</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Objet de l'intervention</FormLabel>
            <FormControl><Input placeholder="Ex: Réparation pompe" {...field} className="rounded-xl" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="intervention_date" render={({ field }) => (
            <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="maintenance_type" render={({ field }) => (
            <FormItem>
              <FormLabel>Type de Maintenance</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Préventive">Préventive</SelectItem>
                  <SelectItem value="Corrective">Corrective</SelectItem>
                  <SelectItem value="Curative">Curative</SelectItem>
                  <SelectItem value="Palliative">Palliative</SelectItem>
                  <SelectItem value="Améliorative">Améliorative</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/30">
          <div className="space-y-0.5">
            <FormLabel className="text-base font-bold flex items-center">
              <Package className="mr-2 h-4 w-4 text-blue-600" />
              Pièces remplacées ?
            </FormLabel>
          </div>
          <FormControl>
            <Switch
              checked={form.watch("parts_replaced")}
              onCheckedChange={(checked) => form.setValue("parts_replaced", checked)}
            />
          </FormControl>
        </div>

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center"><FileText size={14} className="mr-1" /> Détails des travaux</FormLabel>
            <FormControl><Textarea placeholder="Décrivez les actions menées..." {...field} className="rounded-xl h-32 resize-none" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="sticky bottom-0 bg-background pt-2 pb-1">
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 rounded-xl h-12 font-bold shadow-lg" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <>{initialData ? <Save className="mr-2" /> : <CheckCircle2 className="mr-2" />} {initialData ? "Sauvegarder" : "Enregistrer"}</>}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddPastInterventionForm;