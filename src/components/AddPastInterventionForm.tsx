"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, User, CheckCircle2, PenTool, MapPin, Warehouse, PackageOpen, FileSpreadsheet, Clock } from "lucide-react";

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
import { useOfflineManager } from "@/hooks/useOfflineManager";
import SignaturePad from "./SignaturePad";
import InterventionAttachmentsManager from "./InterventionAttachmentsManager";

const InterventionSchema = z.object({
  rit_number: z.string().min(1, "Le numéro RIT est requis."),
  title: z.string().min(5, "Le titre est trop court."),
  description: z.string().min(10, "Détaillez les travaux."),
  maintenance_type: z.string().min(1, "Type requis"),
  asset_id: z.string().min(1, "Équipement requis."),
  technician_id: z.string().min(1, "Technicien requis."),
  start_date: z.string().min(1, "Date début requise."),
  end_date: z.string().min(1, "Date fin requise."),
  total_cost: z.coerce.number().min(0),
  intervention_place: z.enum(["Sur Site", "Atelier / Service Technique"]),
  accessories_received: z.string().optional().default(""),
});

interface AddPastInterventionFormProps {
  assetId?: string;
  initialData?: any; // Peut être un work_order
  onSuccess: () => void;
}

const AddPastInterventionForm: React.FC<AddPastInterventionFormProps> = ({ assetId, initialData, onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [savedInterventionId, setSavedInterventionId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { isOnline, saveOfflineIntervention } = useOfflineManager();

  const formatForInput = (isoString?: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const form = useForm<z.infer<typeof InterventionSchema>>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      rit_number: "",
      title: initialData?.title || "",
      description: initialData?.description?.split(']')[1] || initialData?.description || "",
      maintenance_type: initialData?.maintenance_type || "Corrective",
      asset_id: assetId || initialData?.asset_id || "",
      technician_id: initialData?.assigned_to || user?.id || "",
      start_date: formatForInput(new Date().toISOString()),
      end_date: formatForInput(new Date().toISOString()),
      total_cost: 0,
      intervention_place: "Sur Site",
      accessories_received: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: assetList } = await supabase.from('assets').select('id, name, serial_number, location, brand').order('name');
      setAssets(assetList || []);
      const { data: techList } = await supabase.from('profiles').select('id, first_name, last_name').order('last_name');
      setTechnicians(techList || []);
    };
    fetchData();
  }, []);

  const onSubmit = async (data: z.infer<typeof InterventionSchema>) => {
    setIsLoading(true);
    try {
      const payload = {
        user_id: user?.id,
        technician_id: data.technician_id,
        asset_id: data.asset_id,
        rit_number: data.rit_number,
        title: data.title,
        description: data.description,
        maintenance_type: data.maintenance_type,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
        intervention_date: new Date(data.start_date).toISOString().split('T')[0],
        total_cost: data.total_cost,
        client_signature_url: signatureUrl,
        intervention_place: data.intervention_place,
        accessories_received: data.accessories_received,
      };

      const { data: newInv, error } = await supabase.from('interventions').insert(payload).select('id').single();
      if (error) throw error;

      // CLÔTURE AUTOMATIQUE DE LA PANNE (Workflow Step Final)
      if (initialData?.id && initialData?.reporter_name) {
         await supabase.from('work_orders').update({ status: 'Terminé' }).eq('id', initialData.id);
      }

      setSavedInterventionId(newInv.id);
      showSuccess("Étape Intervention terminée. OT clôturé.");
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            <FormField control={form.control} name="rit_number" render={({ field }) => (
              <FormItem><FormLabel>N° de Rapport (RIT)</FormLabel><FormControl><Input placeholder="Ex: RIT-2024-001" {...field} className="rounded-xl font-bold" /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="asset_id" render={({ field }) => (
                <FormItem><FormLabel>Équipement</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl h-auto py-2"><SelectValue placeholder="Choisir" /></SelectTrigger></FormControl>
                  <SelectContent>{assets.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{a.name} ({a.location})</SelectItem>)}</SelectContent>
                </Select></FormItem>
              )} />
              <FormField control={form.control} name="intervention_place" render={({ field }) => (
                <FormItem><FormLabel>Lieu</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent><SelectItem value="Sur Site">Sur Site</SelectItem><SelectItem value="Atelier / Service Technique">Atelier</SelectItem></SelectContent>
                </Select></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Objet</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem><FormLabel>Début</FormLabel><FormControl><Input type="datetime-local" {...field} className="rounded-xl" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem><FormLabel>Fin</FormLabel><FormControl><Input type="datetime-local" {...field} className="rounded-xl" /></FormControl></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Travaux réalisés</FormLabel><FormControl><Textarea {...field} className="rounded-xl h-24 resize-none" /></FormControl></FormItem>
            )} />

            <Button type="submit" className="w-full bg-blue-600 rounded-xl h-12 font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="mr-2" />} 
              Valider l'Intervention & Clôturer l'OT
            </Button>
          </form>
        </Form>
      ) : (
        <div className="space-y-6 text-center animate-in zoom-in">
          <div className="bg-green-100 p-6 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-green-600 shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">INTERVENTION RÉUSSIE</h3>
            <p className="text-sm text-slate-500">L'Ordre de Travail est maintenant clôturé. Ajoutez des pièces jointes si nécessaire.</p>
          </div>
          <InterventionAttachmentsManager interventionId={savedInterventionId} userId={user?.id} />
          <Button onClick={onSuccess} className="w-full bg-slate-900 rounded-xl">Terminer</Button>
        </div>
      )}
    </div>
  );
};

export default AddPastInterventionForm;