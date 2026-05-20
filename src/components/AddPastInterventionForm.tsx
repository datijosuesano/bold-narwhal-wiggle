"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, User, CheckCircle2, PenTool, MapPin, Warehouse } from "lucide-react";

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
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères."),
  description: z.string().min(10, "Veuillez décrire l'action menée (10 car. min)."),
  maintenance_type: z.string().min(1, "Le type est requis"),
  asset_id: z.string().min(1, "Veuillez sélectionner un équipement."),
  technician_id: z.string().min(1, "Le technicien est requis."),
  intervention_date: z.string().min(1, "La date est requise."),
  total_cost: z.coerce.number().min(0, "Le coût doit être positif"),
  intervention_place: z.enum(["Sur Site", "Atelier / Service Technique"]),
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
  const [showSignature, setShowSignature] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [savedInterventionId, setSavedInterventionId] = useState<string | null>(initialData?.id || null);
  
  const { user } = useAuth();
  const { isOnline, saveOfflineIntervention } = useOfflineManager();

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      maintenance_type: initialData?.maintenance_type || "Corrective",
      asset_id: assetId || initialData?.asset_id || "",
      technician_id: initialData?.technician_id || user?.id || "",
      intervention_date: initialData?.intervention_date || new Date().toISOString().split('T')[0],
      total_cost: initialData?.total_cost || 0,
      intervention_place: initialData?.intervention_place || "Sur Site",
    },
  });

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
    if (!user) {
      showError("Vous devez être connecté.");
      return;
    }

    const payload = {
      user_id: user.id,
      technician_id: data.technician_id,
      asset_id: data.asset_id,
      title: data.title,
      description: data.description,
      maintenance_type: data.maintenance_type as any,
      intervention_date: data.intervention_date,
      total_cost: data.total_cost,
      client_signature_url: signatureUrl,
      intervention_place: data.intervention_place,
    };

    if (!isOnline) {
      saveOfflineIntervention(payload);
      onSuccess();
      return;
    }

    setIsLoading(true);
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
        showSuccess("Intervention enregistrée !");
      }
    } catch (err: any) {
      showError(`Erreur : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!savedInterventionId ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="asset_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Équipement</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                </FormItem>
              )} />
              <FormField control={form.control} name="intervention_place" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lieu de l'action</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl h-10">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Sur Site">
                        <div className="flex items-center"><MapPin size={14} className="mr-2 text-blue-600" /> Sur Site</div>
                      </SelectItem>
                      <SelectItem value="Atelier / Service Technique">
                        <div className="flex items-center"><Warehouse size={14} className="mr-2 text-purple-600" /> Atelier / Service Technique</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} className="rounded-xl" /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="technician_id" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><User size={14} className="mr-1" /> Technicien</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Sélectionner" /></SelectTrigger></FormControl>
                    <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Détails des travaux</FormLabel>
                <FormControl><Textarea placeholder="Actions menées..." {...field} className="rounded-xl h-24 resize-none" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full rounded-xl border-dashed border-blue-300 text-blue-600"
                onClick={() => setShowSignature(!showSignature)}
              >
                <PenTool size={16} className="mr-2" /> 
                {signatureUrl ? "Signature enregistrée" : "Faire signer le client"}
              </Button>
              
              {showSignature && (
                <div className="mt-4 p-4 bg-slate-50 rounded-2xl border animate-in fade-in zoom-in-95">
                  <p className="text-xs font-bold uppercase text-slate-500 mb-2">Signature du client</p>
                  <SignaturePad onSave={(url) => { setSignatureUrl(url); setShowSignature(false); showSuccess("Signature capturée !"); }} />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12 font-bold shadow-lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} 
              {isOnline ? "Enregistrer l'intervention" : "Enregistrer Hors Ligne"}
            </Button>
          </form>
        </Form>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-4">
            <div className="bg-green-600 p-2 rounded-full text-white">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800">Intervention enregistrée !</p>
              <p className="text-xs text-green-600">Vous pouvez maintenant joindre des documents.</p>
            </div>
          </div>

          <InterventionAttachmentsManager interventionId={savedInterventionId} userId={user?.id} />
          
          <Button 
            type="button" 
            variant="default" 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 font-bold" 
            onClick={onSuccess}
          >
            Terminer la saisie
          </Button>
        </div>
      )}
    </div>
  );
};

export default AddPastInterventionForm;