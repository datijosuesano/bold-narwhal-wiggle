"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, User, CheckCircle2, PenTool, MapPin, Warehouse, PackageOpen, FileSpreadsheet, Clock, Plus, Trash2, Box } from "lucide-react";

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

interface SelectedPart {
  partId: string;
  quantity: number;
}

const AddPastInterventionForm: React.FC<AddPastInterventionFormProps> = ({ assetId, initialData, onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
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
      const { data: partList } = await supabase.from('spare_parts').select('id, name, reference, current_stock').order('name');
      setSpareParts(partList || []);
    };
    fetchData();
  }, []);

  const handleAddPartRow = () => {
    setSelectedParts([...selectedParts, { partId: "", quantity: 1 }]);
  };

  const handleRemovePartRow = (index: number) => {
    const updated = [...selectedParts];
    updated.splice(index, 1);
    setSelectedParts(updated);
  };

  const handlePartChange = (index: number, partId: string) => {
    const updated = [...selectedParts];
    updated[index].partId = partId;
    // Réinitialiser la quantité à 1 par précaution
    updated[index].quantity = 1;
    setSelectedParts(updated);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...selectedParts];
    updated[index].quantity = Math.max(1, quantity);
    setSelectedParts(updated);
  };

  const onSubmit = async (data: z.infer<typeof InterventionSchema>) => {
    setIsLoading(true);

    // Étape 5 : Empêcher l'utilisation d'une quantité supérieure au stock disponible
    for (const item of selectedParts) {
      if (!item.partId) {
        showError("Veuillez sélectionner une pièce de rechange valide pour chaque ligne.");
        setIsLoading(false);
        return;
      }
      const matchedPart = spareParts.find(p => p.id === item.partId);
      if (matchedPart) {
        if (item.quantity > matchedPart.current_stock) {
          showError(`Stock insuffisant pour "${matchedPart.name}". Disponible : ${matchedPart.current_stock} unité(s).`);
          setIsLoading(false);
          return;
        }
      }
    }

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

      // CLÔTURE ET LIAISON AUTOMATIQUE DE L'ORDRE DE TRAVAIL (Workflow Pipeline)
      if (initialData?.id) {
         await supabase.from('work_orders').update({ 
           status: 'Terminé',
           closed_at: new Date().toISOString(),
           intervention_id: newInv.id // Liaison physique ici
         }).eq('id', initialData.id);
      }

      // Étape 4 : Enregistrer les lignes d'interventions, décrémenter le stock et créer les mouvements
      for (const item of selectedParts) {
        if (!item.partId) continue;

        // 1. Ligne intervention_parts
        const { error: partLinkError } = await supabase.from('intervention_parts').insert({
          intervention_id: newInv.id,
          part_id: item.partId,
          quantity: item.quantity
        });
        if (partLinkError) throw partLinkError;

        // 2. Décrémentation spare_parts.current_stock
        const matchedPart = spareParts.find(p => p.id === item.partId);
        if (matchedPart) {
          const newStock = Math.max(0, matchedPart.current_stock - item.quantity);
          const { error: stockUpdateError } = await supabase
            .from('spare_parts')
            .update({ current_stock: newStock })
            .eq('id', item.partId);
          if (stockUpdateError) throw stockUpdateError;

          // 3. Mouvement de stock (Table stock_movements)
          await supabase.from('stock_movements').insert({
            part_id: item.partId,
            movement_type: 'OUT',
            quantity: item.quantity,
            reference_type: 'Intervention',
            reference_id: newInv.id
          });

          // 4. Mouvement de stock (Table spare_part_movements pour compatibilité existante)
          await supabase.from('spare_part_movements').insert({
            part_id: item.partId,
            user_id: user?.id,
            quantity: item.quantity,
            type: 'OUT',
            reason: `Utilisé dans l'intervention RIT ${data.rit_number}`
          });
        }
      }

      setSavedInterventionId(newInv.id);
      showSuccess("Intervention enregistrée, stock mis à jour et Ordre de travail lié clôturé !");
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

            {/* Étape 3 : Saisie des pièces de rechange utilisées */}
            <div className="border rounded-2xl p-4 bg-slate-50 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                  <Box size={14} className="text-blue-600" />
                  Pièces de rechange utilisées
                </h4>
                <Button 
                  type="button" 
                  onClick={handleAddPartRow} 
                  size="sm" 
                  variant="outline" 
                  className="rounded-xl h-8 border-blue-200 text-blue-600 hover:bg-blue-50 text-[10px]"
                >
                  <Plus size={12} className="mr-1" /> Ajouter une pièce
                </Button>
              </div>

              {selectedParts.length > 0 ? (
                <div className="space-y-3">
                  {selectedParts.map((item, index) => {
                    const matchedPart = spareParts.find(p => p.id === item.partId);
                    const maxStock = matchedPart ? matchedPart.current_stock : 0;
                    return (
                      <div key={index} className="flex gap-2 items-end bg-white p-3 rounded-xl border">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Sélectionner la pièce</label>
                          <Select onValueChange={(val) => handlePartChange(index, val)} value={item.partId}>
                            <SelectTrigger className="h-9 rounded-lg">
                              <SelectValue placeholder="Choisir la référence" />
                            </SelectTrigger>
                            <SelectContent>
                              {spareParts.map(p => (
                                <SelectItem key={p.id} value={p.id} disabled={p.current_stock <= 0}>
                                  {p.name} (Ref: {p.reference}) [Dispo: {p.current_stock}]
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-24 space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Qté</label>
                          <Input 
                            type="number" 
                            min="1" 
                            max={maxStock || 1} 
                            value={item.quantity} 
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                            className="h-9 rounded-lg"
                          />
                        </div>

                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemovePartRow(index)}
                          className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-4 text-xs text-slate-400 italic bg-white rounded-xl border border-dashed">
                  Aucune pièce de rechange associée pour le moment.
                </p>
              )}
            </div>

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