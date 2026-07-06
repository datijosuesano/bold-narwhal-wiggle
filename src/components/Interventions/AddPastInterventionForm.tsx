"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/utils/toast";

import { interventionService } from "./interventionService";
import { InterventionSchema, InterventionFormValues } from "./schema";

import {
  MAINTENANCE_TYPES,
  INTERVENTION_STATUSES,
} from "@/constants/intervention";

import InterventionPartsSelector from "./InterventionPartsSelector";

const AddPastIntervention: React.FC<{
  initialData?: any;
  onSuccess: () => void;
}> = ({ initialData, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  /* ================= LISTES DÉROULANTES ================= */
  const [parts, setParts] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]); // Liste des équipements chargés depuis la DB

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      title: "",
      description: "",
      maintenance_type: "Corrective",
      intervention_status: "En attente",
      asset_id: "",
      technician_id: user?.id || "",
      intervention_date: "",
      start_date: "",
      end_date: "",
      total_cost: 0,
      invoice_number: "",
      invoice_status: "Non facturé",
      user_id: user?.id || "",
    },
  });

  /* ================= CHARGEMENT INITIAL ================= */
  useEffect(() => {
    // 1. Charger la liste des équipements (assets) pour le menu déroulant
    const loadAssets = async () => {
      try {
        const data = await interventionService.getAssets();
        setAssets(data || []);
      } catch (err) {
        console.error("Erreur lors du chargement des équipements :", err);
      }
    };
    
    loadAssets();
  }, []);

  /* ================= MODE ÉDITION ================= */
  useEffect(() => {
    if (!initialData) return;

    form.reset({
      title: initialData.title ?? "",
      description: initialData.description ?? "",
      maintenance_type: initialData.maintenance_type ?? "Corrective",
      intervention_status: initialData.intervention_status ?? "En attente",
      asset_id: initialData.asset_id ?? "",
      technician_id: initialData.technician_id ?? user?.id ?? "",
      intervention_date: initialData.intervention_date ?? "",
      start_date: initialData.start_date?.slice(0, 16) ?? "",
      end_date: initialData.end_date?.slice(0, 16) ?? "",
      total_cost: initialData.total_cost ?? 0,
      invoice_number: initialData.invoice_number ?? "",
      invoice_status: initialData.invoice_status ?? "Non facturé",
      user_id: initialData.user_id ?? user?.id ?? "",
    });

    if (initialData.id) {
      interventionService.getParts(initialData.id)
        .then((existingParts) => {
          if (existingParts) {
            setParts(existingParts.map(p => ({
              part_id: p.part_id,
              quantity: p.quantity
            })));
          }
        })
        .catch((err) => console.error(err));
    }
  }, [initialData, form, user?.id]);

  /* ================= SUBMIT ================= */
  const onSubmit = async (values: InterventionFormValues) => {
    setLoading(true);

    try {
      // Nettoyage des chaînes vides ("") en null pour éviter l'erreur UUID de Supabase
      const payload = {
        ...values,
        asset_id: values.asset_id || null,
        technician_id: values.technician_id || user?.id || null,
        user_id: user?.id || null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        intervention_date: values.intervention_date || new Date().toISOString().split('T')[0],
      };

      if (!initialData?.id) {
        await interventionService.createFullIntervention(payload, parts);
      } else {
        await interventionService.updateFullIntervention(initialData.id, payload, parts);
      }

      showSuccess(initialData?.id ? "Intervention modifiée" : "Intervention enregistrée");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      showError(err.message || "Erreur lors de l’enregistrement");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>

        {/* OBJET */}
        <FormField
          name="title"
          control={form.control}
          render={({ field }) => (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Objet de l'intervention</label>
              <Input {...field} placeholder="Ex: Remplacement écran ou Maintenance préventive" />
            </div>
          )}
        />

        {/* MENU DÉROULANT DES ÉQUIPEMENTS (ASSETS) */}
        <FormField
          name="asset_id"
          control={form.control}
          render={({ field }) => (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Équipement concerné</label>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir l'appareil en panne..." />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} {asset.location ? `(${asset.location})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />

        {/* DESCRIPTION */}
        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Description des travaux</label>
              <Textarea {...field} placeholder="Détails des actions correctives ou préventives menées..." />
            </div>
          )}
        />

        {/* TYPE DE MAINTENANCE & STATUT */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="maintenance_type"
            control={form.control}
            render={({ field }) => (
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Type de maintenance</label>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <FormField
            name="intervention_status"
            control={form.control}
            render={({ field }) => (
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Statut de la demande</label>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVENTION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
        </div>

        {/* DATE DE L'INTERVENTION */}
        <FormField
          name="intervention_date"
          control={form.control}
          render={({ field }) => (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Date du rapport</label>
              <Input type="date" {...field} />
            </div>
          )}
        />

        {/* HEURE DE DÉBUT & FIN */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="start_date"
            control={form.control}
            render={({ field }) => (
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Heure de début</label>
                <Input type="datetime-local" {...field} />
              </div>
            )}
          />

          <FormField
            name="end_date"
            control={form.control}
            render={({ field }) => (
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Heure de fin</label>
                <Input type="datetime-local" {...field} />
              </div>
            )}
          />
        </div>

        {/* COÛT & FACTURE */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="total_cost"
            control={form.control}
            render={({ field }) => (
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Coût des services (hors pièces)</label>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </div>
            )}
          />

          <FormField
            name="invoice_number"
            control={form.control}
            render={({ field }) => (
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">N° Facture (optionnel)</label>
                <Input {...field} placeholder="FAC-XXXX" />
              </div>
            )}
          />
        </div>

        {/* SÉLECTEUR DE PIÈCES DÉTACHÉES */}
        <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
          <p className="text-sm font-semibold mb-3 text-slate-800">
            Pièces détachées utilisées
          </p>
          <InterventionPartsSelector
            value={parts}
            onChange={setParts}
          />
        </div>

        {/* BOUTON ENREGISTRER */}
        <Button disabled={loading} className="w-full h-11 text-base font-medium">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            initialData?.id ? "Mettre à jour l'intervention" : "Enregistrer l'intervention"
          )}
        </Button>

      </form>
    </Form>
  );
};

export default AddPastIntervention;