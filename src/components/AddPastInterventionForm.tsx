"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle2, Package, Save } from "lucide-react";
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
  description: z.string().min(10, "Veuillez décrire l'action menée (10 car. min)."),
  maintenanceType: z.enum(["Preventive", "Corrective", "Palliative", "Ameliorative"]),
  assetId: z.string().min(1, "Veuillez sélectionner un équipement."),
  date: z.string().min(1, "La date est requise."),
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
  const [spareParts, setSpareParts] = useState<{id: string, name: string, current_stock: number}[]>([]);
  const [assets, setAssets] = useState<{id: string, name: string}[]>([]);
  const { user } = useAuth();

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      maintenanceType: (initialData?.maintenance_type as any) || "Corrective",
      assetId: initialData?.asset_id || assetId || "",
      date: initialData?.intervention_date || initialData?.due_date || format(new Date(), "yyyy-MM-dd"),
      partId: "none",
      partQuantity: 0,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: parts } = await supabase.from('spare_parts').select('id, name, current_stock');
      setSpareParts(parts || []);
      
      const { data: assetList } = await supabase.from('assets').select('id, name').order('name');
      setAssets(assetList || []);
    };
    fetchData();
  }, []);

  const onSubmit = async (data: InterventionFormValues) => {
    if (!user) {
      showError("Vous devez être connecté.");
      return;
    }
    
    setIsLoading(true);

    const payload = {
      user_id: user.id,
      asset_id: data.assetId,
      title: data.title,
      description: data.description,
      maintenance_type: data.maintenanceType,
      intervention_date: data.date,
      parts_replaced: data.partId !== "none" && data.partQuantity > 0,
    };

    try {
      let result;
      if (initialData?.id) {
        result = await supabase.from('interventions').update(payload).eq('id', initialData.id);
      } else {
        result = await supabase.from('interventions').insert(payload);
      }

      if (result.error) throw result.error;

      // Gestion du stock si une pièce a été utilisée
      if (!initialData?.id && data.partId && data.partId !== "none" && data.partQuantity > 0) {
        const selectedPart = spareParts.find(p => p.id === data.partId);
        if (selectedPart) {
          const newStock = Math.max(0, selectedPart.current_stock - data.partQuantity);
          await supabase.from('spare_parts').update({ current_stock: newStock }).eq('id', data.partId);
        }
      }

      showSuccess(initialData?.id ? "Intervention mise à jour !" : "Intervention enregistrée avec succès !");
      onSuccess();
    } catch (err: any) {
      console.error("[AddPastInterventionForm] Erreur:", err);
      showError(`Échec de l'enregistrement: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="assetId" render={({ field }) => (
          <FormItem>
            <FormLabel>Équipement concerné</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={!!initialData}>
              <FormControl>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={assets.length > 0 ? "Choisir un équipement" : "Aucun équipement disponible"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Objet de l'intervention</FormLabel>
            <FormControl><Input placeholder="Ex: Réparation pompe" {...field} className="rounded-xl" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl><Input type="date" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
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
        </div>

        {!initialData && (
          <div className="p-4 bg-blue-50/50 border rounded-xl space-y-4">
            <div className="flex items-center text-sm font-bold text-blue-700 mb-2"><Package size={16} className="mr-2" /> Pièce de rechange utilisée (Optionnel)</div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="partId" render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Pièce utilisée" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">-- Aucune pièce --</SelectItem>
                      {spareParts.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="partQuantity" render={({ field }) => (
                <FormItem>
                  <FormControl><Input type="number" placeholder="Qté" {...field} className="rounded-xl" /></FormControl>
                </FormItem>
              )} />
            </div>
          </div>
        )}

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Détails des travaux</FormLabel>
            <FormControl><Textarea placeholder="Décrivez les actions menées..." {...field} className="rounded-xl h-24" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 rounded-xl h-12 font-bold shadow-lg" disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="animate-spin mr-2" /> Enregistrement...</>
          ) : (
            <>{initialData ? <Save className="mr-2" /> : <CheckCircle2 className="mr-2" />} {initialData ? "Sauvegarder les modifications" : "Enregistrer l'intervention"}</>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AddPastInterventionForm;