"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/utils/toast";

import {
  createIntervention,
  updateIntervention,
} from "@/components/interventions/interventionService";

import {
  InterventionSchema,
  InterventionFormValues,
} from "./schema";

/* =========================================================
   COMPONENT
========================================================= */

const AddPastIntervention: React.FC<{
  initialData?: any;
  onSuccess: () => void;
}> = ({ initialData, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      rit_number: "",
      physical_rit_number: "",

      title: "",
      description: "",
      diagnosis: "",
      work_performed: "",
      recommendations: "",

      maintenance_type: "Corrective",

      asset_id: "",
      technician_id: user?.id || "",
      validated_by: "",

      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),

      total_cost: 0,
      downtime_minutes: 0,

      intervention_place: "Sur Site",

      invoice_number: "",
      invoice_status: "Non facturé",
      invoice_deposited_at: "",

      accessories_received: "",
      parts_replaced: false,

      client_signature_url: "",

      intervention_status: "Completed",

      user_id: user?.id || "",
    },
  });

  /* =========================================================
     RESET MODE EDIT
  ========================================================= */

  useEffect(() => {
    if (!initialData) return;

    form.reset({
      ...form.getValues(),
      ...initialData,
      start_date: initialData.start_date?.slice(0, 16),
      end_date: initialData.end_date?.slice(0, 16),
      invoice_deposited_at:
        initialData.invoice_deposited_at?.slice(0, 16),
    });
  }, [initialData]);

  /* =========================================================
     SUBMIT
  ========================================================= */

  const onSubmit = async (values: InterventionFormValues) => {
    setLoading(true);

    try {
      const payload = {
        ...values,
        user_id: user?.id || null,
      };

      if (initialData?.id) {
        await updateIntervention(initialData.id, payload);
      } else {
        await createIntervention(payload);
      }

      showSuccess("Intervention enregistrée");
      onSuccess();
    } catch (err: any) {
      showError(err.message || "Erreur enregistrement");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     UI HELPERS SECTION
  ========================================================= */

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>

        {/* ===================== SECTION 1 ===================== */}
        <Section title="Informations générales">

          <FormField name="rit_number" control={form.control}
            render={({ field }) => (
              <Input {...field} placeholder="RIT" />
            )}
          />

          <FormField name="physical_rit_number" control={form.control}
            render={({ field }) => (
              <Input {...field} placeholder="RIT physique" />
            )}
          />

          <FormField name="maintenance_type" control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Type maintenance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Corrective">Corrective</SelectItem>
                  <SelectItem value="Preventive">Préventive</SelectItem>
                </SelectContent>
              </Select>
            )}
          />

          <FormField name="intervention_status" control={form.control}
            render={({ field }) => (
              <Input {...field} placeholder="Statut intervention" />
            )}
          />

        </Section>

        {/* ===================== SECTION 2 ===================== */}
        <Section title="Diagnostic & travaux">

          <FormField name="title" control={form.control}
            render={({ field }) => (
              <Input {...field} placeholder="Objet" />
            )}
          />

          <FormField name="description" control={form.control}
            render={({ field }) => (
              <Textarea {...field} placeholder="Description" />
            )}
          />

          <FormField name="diagnosis" control={form.control}
            render={({ field }) => (
              <Textarea {...field} placeholder="Diagnostic" />
            )}
          />

          <FormField name="work_performed" control={form.control}
            render={({ field }) => (
              <Textarea {...field} placeholder="Travaux effectués" />
            )}
          />

          <FormField name="recommendations" control={form.control}
            render={({ field }) => (
              <Textarea {...field} placeholder="Recommandations" />
            )}
          />

        </Section>

        {/* ===================== SECTION 3 ===================== */}
        <Section title="Temps">

          <FormField name="start_date" control={form.control}
            render={({ field }) => (
              <Input type="datetime-local" {...field} />
            )}
          />

          <FormField name="end_date" control={form.control}
            render={({ field }) => (
              <Input type="datetime-local" {...field} />
            )}
          />

          <FormField name="downtime_minutes" control={form.control}
            render={({ field }) => (
              <Input
                type="number"
                {...field}
                onChange={(e) =>
                  field.onChange(Number(e.target.value))
                }
              />
            )}
          />

        </Section>

        {/* ===================== SECTION 4 ===================== */}
        <Section title="Facturation">

          <FormField name="total_cost" control={form.control}
            render={({ field }) => (
              <Input
                type="number"
                {...field}
                onChange={(e) =>
                  field.onChange(Number(e.target.value))
                }
              />
            )}
          />

          <FormField name="invoice_number" control={form.control}
            render={({ field }) => (
              <Input {...field} placeholder="N° facture" />
            )}
          />

          <FormField name="invoice_status" control={form.control}
            render={({ field }) => (
              <Input {...field} placeholder="Statut facture" />
            )}
          />

          <FormField name="invoice_deposited_at" control={form.control}
            render={({ field }) => (
              <Input type="datetime-local" {...field} />
            )}
          />

        </Section>

        {/* ===================== SECTION 5 ===================== */}
        <Section title="Pièces & accessoires">

          <FormField name="parts_replaced" control={form.control}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <FormField name="accessories_received" control={form.control}
            render={({ field }) => (
              <Textarea {...field} placeholder="Accessoires reçus" />
            )}
          />

        </Section>

        {/* ===================== SECTION 6 ===================== */}
        <Section title="Validation & signature">

          <FormField name="validated_by" control={form.control}
            render={({ field }) => (
              <Input {...field} placeholder="Validé par" />
            )}
          />

          <FormField name="client_signature_url" control={form.control}
            render={({ field }) => (
              <Input {...field} placeholder="Signature URL" />
            )}
          />

        </Section>

        {/* SUBMIT */}
        <Button className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            "Enregistrer intervention"
          )}
        </Button>

      </form>
    </Form>
  );
};

export default AddPastIntervention;

/* =========================================================
   SECTION COMPONENT
========================================================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-xl p-4 space-y-3">
      <h3 className="font-bold text-sm text-slate-600">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}