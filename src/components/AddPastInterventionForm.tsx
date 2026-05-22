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
  rit_number: z.string().min(1, "Le numéro RIT est requis (ex: RIT 1234)."),
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères."),
  description: z.string().min(10, "Veuillez décrire l'action menée (10 car. min)."),
  maintenance_type: z.string().min(1, "Le type est requis"),
  asset_id: z.string().min(1, "Veuillez sélectionner un équipement."),
  technician_id: z.string().min(1, "Le technicien est requis."),
  start_date: z.string().min(1, "La date de début est requise."),
  end_date: z.string().min(1, "La date de fin est requise."),
  total_cost: z.coerce.number().min(0, "Le coût doit être positif"),
  intervention_place: z.enum(["Sur Site", "Atelier / Service Technique"]),
  accessories_received: z.string().optional().default(""),
}).refine((data) => {
  const start = new Date(data.start_date).getTime();
  const end = new Date(data.end_date).getTime();
  return end >= start;
}, {
  message: "La date de fin doit être postérieure ou égale à la date de début.",
  path: ["end_date"],
});

type InterventionFormValues = z.infer<typeof InterventionSchema>;

interface AddPastInterventionFormProps {
  assetId?: string;
  initialData?: any;
  onSuccess: () => void;
}

const AddPastInterventionForm: React.FC<AddPastInterventionFormProps> = ({ assetId, initialData, onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [assets, setAssets] = useState<{id: string, name: string, serial_number: string, location: string, brand: string | null}[]>([]);
  const [technicians, setTechnicians] = useState<{id: string, first_name: string, last_name: string}[]>([]);
  const [showSignature, setShowSignature] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [savedInterventionId, setSavedInterventionId] = useState<string | null>(initialData?.id || null);
  
  const { user } = useAuth();
  const { isOnline, saveOfflineIntervention } = useOfflineManager();

  // Helper pour formater une date ISO en datetime-local
  const formatForInput = (isoString?: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      rit_number: initialData?.rit_number || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      maintenance_type: initialData?.maintenance_type || "Corrective",
      asset_id: assetId || initialData?.asset_id || "",
      technician_id: initialData?.technician_id || user?.id || "",
      start_date: formatForInput(initialData?.start_date) || formatForInput(new Date().toISOString()),
      end_date: formatForInput(initialData?.end_date) || formatForInput(new Date().toISOString()),
      total_cost: initialData?.total_cost || 0,
      intervention_place: initialData?.intervention_place || "Sur Site",
      accessories_received: initialData?.accessories_received || "",
    },
  });

  const watchPlace = form.watch("intervention_place");
  const watchStartDate = form.watch("start_date");
  const watchEndDate = form.watch("end_date");

  // Calcul dynamique de la durée
  const calculatedDuration = React.useMemo(() => {
    if (!watchStartDate || !watchEndDate) return null;
    const start = new Date(watchStartDate).getTime();
    const end = new Date(watchEndDate).getTime();
    const diffMs = end - start;
    if (isNaN(diffMs) || diffMs < 0) return null;

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remainingHours = hours % 24;
      return `${days}j ${remainingHours}h ${mins}min`;
    }
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  }, [watchStartDate, watchEndDate]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: assetList } = await supabase.from('assets').select('id, name, serial_number, location, brand').order('name');
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
      rit_number: data.rit_number,
      title: data.title,
      description: data.description,
      maintenance_type: data.maintenance_type as any,
      start_date: new Date(data.start_date).toISOString(),
      end_date: new Date(data.end_date).toISOString(),
      intervention_date: new Date(data.start_date).toISOString().split('T')[0], // pour compatibilité historique
      total_cost: data.total_cost,
      client_signature_url: signatureUrl,
      intervention_place: data.intervention_place,
      accessories_received: data.intervention_place === "Atelier / Service Technique" ? (data.accessories_received || null) : null,
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
            {initialData?.reporter_name && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-3 mb-2">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-blue-600 leading-none">Signalé par</p>
                  <p className="text-sm font-bold text-slate-900">{initialData.reporter_name}</p>
                </div>
              </div>
            )}

            {/* Nouveau champ Numéro de Rapport RIT */}
            <FormField control={form.control} name="rit_number" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5"><FileSpreadsheet size={16} className="text-blue-600" /> Numéro de Rapport d'Intervention (RIT)</FormLabel>
                <FormControl><Input placeholder="Ex: RIT 2045" {...field} className="rounded-xl border-blue-200 font-bold focus-visible:ring-blue-500" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

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
                            <span className="font-bold text-xs">
                              {a.name} {a.brand ? `(${a.brand})` : ""}
                            </span>
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

            {watchPlace === "Atelier / Service Technique" && (
              <FormField control={form.control} name="accessories_received" render={({ field }) => (
                <FormItem className="animate-in slide-in-from-top-2 duration-300">
                  <FormLabel className="flex items-center gap-1.5"><PackageOpen size={14} className="text-purple-600" /> Accessoires reçus avec l'appareil</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Câble d'alimentation, capteur SpO2, housse..." {...field} className="rounded-xl border-purple-200 focus-visible:ring-purple-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Objet de l'intervention</FormLabel>
                <FormControl><Input placeholder="Ex: Réparation pompe" {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Nouveaux champs pour dates/heures de début et fin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Début de l'intervention</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} className="rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fin de l'intervention</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} className="rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Aperçu de la durée calculée */}
            {calculatedDuration && (
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-2.5 text-blue-800 text-xs font-semibold animate-in fade-in duration-300">
                <Clock size={16} className="text-blue-600" />
                <span>Durée estimée d'intervention : <strong className="text-sm font-black text-blue-900">{calculatedDuration}</strong></span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="maintenance_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de Maintenance</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Corrective">Corrective</SelectItem>
                      <SelectItem value="Préventive">Préventive</SelectItem>
                      <SelectItem value="Curative">Curative</SelectItem>
                      <SelectItem value="Palliative">Palliative</SelectItem>
                      <SelectItem value="Améliorative">Améliorative</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
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