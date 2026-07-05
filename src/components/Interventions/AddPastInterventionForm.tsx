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

// Assure-toi que le chemin est correct selon l'endroit où tu as placé ce fichier
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

  /* ================= PARTS STATE ================= */
  const [parts, setParts] = useState<any[]>([]);

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

  /* ================= EDIT MODE ================= */
  useEffect(() => {
    if (!initialData) return;

    // 1. Préremplir le formulaire avec les données de l'intervention
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

    // 2. Charger les pièces déjà attachées à cette intervention via le service
    if (initialData.id) {
      interventionService.getParts(initialData.id)
        .then((existingParts) => {
          if (existingParts && existingParts.length > 0) {
            // On formate pour que le sélecteur comprenne (part_id et quantity)
            setParts(existingParts.map(p => ({
              part_id: p.part_id,
              quantity: p.quantity
            })));
          }
        })
        .catch((err) => {
          console.error("Erreur lors de la récupération des pièces", err);
        });
    }
  }, [initialData, form, user?.id]);

  /* ================= SUBMIT ================= */
  const onSubmit = async (values: InterventionFormValues) => {
    setLoading(true);

    try {
      const payload = {
        ...values,
        user_id: user?.id || null,
      };

      /* ================= ROUTAGE CREATE / UPDATE ================= */
      if (!initialData?.id) {
        // Nouvelle intervention : on crée tout (intervention + pièces + décrémentation stock)
        await interventionService.createFullIntervention(payload, parts);
      } else {
        // Édition : on met à jour l'intervention, on purge les anciennes pièces, on restaure/décrémente le stock
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

        {/* TITLE */}
        <FormField
          name="title"
          control={form.control}
          render={({ field }) => (
            <Input {...field} placeholder="Objet de l'intervention" />
          )}
        />

        {/* DESCRIPTION */}
        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <Textarea {...field} placeholder="Description des travaux" />
          )}
        />

        {/* TYPE */}
        <FormField
          name="maintenance_type"
          control={form.control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Type de maintenance" />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        {/* STATUS */}
        <FormField
          name="intervention_status"
          control={form.control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {INTERVENTION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        {/* DATES */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="start_date"
            control={form.control}
            render={({ field }) => (
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Début</label>
                <Input type="datetime-local" {...field} />
              </div>
            )}
          />

          <FormField
            name="end_date"
            control={form.control}
            render={({ field }) => (
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Fin</label>
                <Input type="datetime-local" {...field} />
              </div>
            )}
          />
        </div>

        {/* COST & INVOICE */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="total_cost"
            control={form.control}
            render={({ field }) => (
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Coût total</label>
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
                <label className="text-xs font-medium text-slate-500 mb-1 block">N° Facture</label>
                <Input {...field} placeholder="Ex: FAC-2026-001" />
              </div>
            )}
          />
        </div>

        {/* ================= PARTS ================= */}
        <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
          <p className="text-sm font-semibold mb-3 text-slate-800">
            Pièces détachées utilisées
          </p>

          <InterventionPartsSelector
            value={parts}
            onChange={setParts}
          />
        </div>

        {/* SUBMIT */}
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