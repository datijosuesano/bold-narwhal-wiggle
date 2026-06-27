"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Wrench, Calendar, MapPin, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const InterventionSchema = z.object({
  rit_number: z.string().min(1, "RIT requis"),
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
      rit_number: initialData?.rit_number || `RIT-${Math.floor(100000 + Math.random() * 900000)}`,
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
    const loadSelectData = async () => {
      try {
        const [assetsRes, profilesRes] = await Promise.all([
          supabase.from("assets").select("id, name, location").order("name"),
          supabase.from("profiles").select("id, first_name, last_name").order("last_name")
        ]);
        setAssets(assetsRes.data || []);
        setTechs((profilesRes.data || []).map(t => ({
          id: t.id,
          name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Technicien'
        })));
      } catch (err) {
        console.error("Erreur de chargement des ressources :", err);
      }
    };
    loadSelectData();
  }, []);

  const onSubmit = async (data: InterventionFormValues) => {
    setIsLoading(true);
    const payload = {
      ...data,
      user_id: user?.id || null,
      intervention_date: data.start_date.split('T')[0]
    };

    try {
      if (initialData?.id) {
        // --- MODIFICATION ---
        const { error } = await supabase
          .from("interventions")
          .update(payload)
          .eq("id", initialData.id);

        if (error) throw error;
        showSuccess("Intervention mise à jour !");
      } else {
        // --- CRÉATION ---
        const { error } = await supabase
          .from("interventions")
          .insert(payload);

        if (error) throw error;
        showSuccess("Intervention enregistrée avec succès !");
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rit_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° de Rapport (RIT)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: RIT-102910" className="rounded-xl font-mono uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maintenance_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de maintenance</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Corrective">Corrective (Dépannage)</SelectItem>
                    <SelectItem value="Préventive">Préventive (Entretien)</SelectItem>
                    <SelectItem value="Curative">Curative</SelectItem>
                    <SelectItem value="Améliorative">Améliorative</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objet / Titre de l'intervention</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Remplacement alimentation ou révision" className="rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Détail des actions réalisées</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Décrivez les travaux effectués..." className="rounded-xl resize-none h-24" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="asset_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Équipement concerné</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    {assets.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name} ({a.location})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="technician_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Technicien Intervenant</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Attribuer à" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    {techs.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date & Heure de début</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date & Heure de fin</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="intervention_place"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lieu de l'intervention</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Sur Site">Sur Site (Client)</SelectItem>
                    <SelectItem value="Atelier / Service Technique">Atelier / Service Technique</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="total_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coût total (FCFA)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} className="rounded-xl font-bold" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-bold shadow-md mt-4" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
          {initialData ? "Sauvegarder les modifications" : "Enregistrer l'Intervention"}
        </Button>
      </form>
    </Form>
  );
};

export default AddPastInterventionForm;