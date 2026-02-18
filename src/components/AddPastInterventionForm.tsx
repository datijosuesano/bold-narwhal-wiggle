"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle2, Package, Save, Clock, User, DollarSign, FileText } from "lucide-react";
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
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const InterventionSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères."),
  workDetails: z.string().min(10, "Veuillez décrire l'action menée (10 car. min)."),
  maintenanceType: z.string().min(1, "Le type est requis"),
  assetId: z.string().min(1, "Veuillez sélectionner un équipement."),
  technicianId: z.string().min(1, "Le technicien est requis."),
  date: z.string().min(1, "La date est requise."),
  duration: z.coerce.number().min(0, "La durée doit être positive"),
  totalCost: z.coerce.number().min(0, "Le coût doit être positif"),
  partsCost: z.coerce.number().min(0, "Le coût des pièces doit être positif"),
  partId: z.string().optional(),
  partQuantity: z.preprocess((a) => (a === "" ? 0 : parseInt(z.string().parse(a), 10)), z.number().min(0)),
});

type InterventionFormValues = z.infer<typeof InterventionSchema>;

interface AddPastInterventionFormProps {
  assetId?: string;
  initialData?: any;
  onSuccess: () => void;
}

const AddPastInterventionForm: React.FC<AddPastInterventionFormProps> = ({ assetId, initialData, onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [spareParts, setSpareParts] = useState<{id: string, name: string, current_stock: number, purchase_cost: number}[]>([]);
  const [assets, setAssets] = useState<{id: string, name: string}[]>([]);
  const [technicians, setTechnicians] = useState<{id: string, first_name: string, last_name: string}[]>([]);
  const { user } = useAuth();

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      title: initialData?.title || "",
      workDetails: initialData?.work_details || "",
      maintenanceType: initialData?.maintenance_type || "Corrective",
      assetId: initialData?.asset_id || assetId || "",
      technicianId: initialData?.user_id || user?.id || "",
      date: initialData?.intervention_date || format(new Date(), "yyyy-MM-dd"),
      duration: initialData?.duration_minutes || 0,
      totalCost: initialData?.total_cost || 0,
      partsCost: initialData?.parts_cost || 0,
      partId: "none",
      partQuantity: 0,
    },
  });

  const watchPartId = form.watch("partId");
  const watchPartQuantity = form.watch("partQuantity");

  useEffect(() => {
    const fetchData = async () => {
      const { data: parts } = await supabase.from('spare_parts').select('id, name, current_stock, purchase_cost');
      setSpareParts(parts || []);
      
      const { data: assetList } = await supabase.from('assets').select('id, name').order('name');
      setAssets(assetList || []);

      const { data: techList } = await supabase.from('profiles').select('id, first_name, last_name').eq('role', 'technician').order('last_name');
      setTechnicians(techList || []);
    };
    fetchData();
  }, []);

  // Calcul automatique du coût des pièces
  useEffect(() => {
    if (watchPartId && watchPartId !== "none" && watchPartQuantity > 0) {
      const part = spareParts.find(p => p.id === watchPartId);
      if (part) {
        const calculatedCost = part.purchase_cost * watchPartQuantity;
        form.setValue("partsCost", calculatedCost);
        // On suggère aussi de mettre à jour le coût total si celui-ci est à 0
        if (form.getValues("totalCost") === 0) {
          form.setValue("totalCost", calculatedCost);
        }
      }
    } else if (watchPartId === "none") {
      form.setValue("partsCost", 0);
      form.setValue("partQuantity", 0);
    }
  }, [watchPartId, watchPartQuantity, spareParts, form]);

  const onSubmit = async (data: InterventionFormValues) => {
    setIsLoading(true);

    const payload = {
      user_id: data.technicianId,
      asset_id: data.assetId,
      title: data.title,
      work_details: data.workDetails,
      maintenance_type: data.maintenanceType,
      intervention_date: data.date,
      duration_minutes: data.duration,
      total_cost: data.totalCost,
      parts_cost: data.partsCost,
      parts_replaced: data.partId !== "none" && data.partQuantity > 0,
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

      // Décrémentation du stock si une pièce est utilisée
      if (!initialData?.id && data.partId && data.partId !== "none" && data.partQuantity > 0) {
        const selectedPart = spareParts.find(p => p.id === data.partId);
        if (selectedPart) {
          const newStock = Math.max(0, selectedPart.current_stock - data.partQuantity);
          await supabase.from('spare_parts').update({ current_stock: newStock }).eq('id', data.partId);
        }
      }

      showSuccess(initialData?.id ? "Intervention mise à jour !" : "Intervention enregistrée !");
      onSuccess();
    } catch (err: any) {
      showError(`Erreur: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="assetId" render={({ field }) => (
            <FormItem>
              <FormLabel>Équipement</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!!initialData}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir" /></SelectTrigger></FormControl>
                <SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="technicianId" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><User size={14} className="mr-1" /> Technicien</FormLabel>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="maintenanceType" render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Preventive">Préventive</SelectItem>
                  <SelectItem value="Corrective">Corrective</SelectItem>
                  <SelectItem value="Palliative">Palliative</SelectItem>
                  <SelectItem value="Ameliorative">Améliorative</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="duration" render={({ field }) => (
            <FormItem><FormLabel className="flex items-center"><Clock size={14} className="mr-1" /> Durée (min)</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-4">
          <div className="flex items-center text-sm font-bold text-blue-700"><Package size={16} className="mr-2" /> Pièces de Rechange</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="partId" render={({ field }) => (
              <FormItem>
                <FormLabel>Sélectionner la pièce</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Aucune" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">-- Aucune pièce --</SelectItem>
                    {spareParts.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.purchase_cost} FCFA)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="partQuantity" render={({ field }) => (
              <FormItem>
                <FormLabel>Quantité utilisée</FormLabel>
                <FormControl><Input type="number" {...field} className="rounded-xl" disabled={watchPartId === "none"} /></FormControl>
              </FormItem>
            )} />
          </div>
        </div>

        <div className="p-4 bg-muted/30 border rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-bold text-primary"><DollarSign size={16} className="mr-2" /> Récapitulatif Financier</div>
            <div className="flex gap-4">
              <FormField control={form.control} name="partsCost" render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormLabel className="text-xs font-medium">Pièces (FCFA)</FormLabel>
                  <FormControl><Input type="number" {...field} className="rounded-lg h-8 w-24 text-xs font-bold bg-blue-50" readOnly /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="totalCost" render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormLabel className="text-xs font-medium">Total (FCFA)</FormLabel>
                  <FormControl><Input type="number" {...field} className="rounded-lg h-8 w-24 text-xs font-bold" /></FormControl>
                </FormItem>
              )} />
            </div>
          </div>
        </div>

        <FormField control={form.control} name="workDetails" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center"><FileText size={14} className="mr-1" /> Détails des travaux</FormLabel>
            <FormControl><Textarea placeholder="Décrivez les actions menées..." {...field} className="rounded-xl h-24 resize-none" /></FormControl>
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