"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, FlaskConical } from "lucide-react";
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
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ReagentSchema = z.object({
  name: z.string().min(3, "Le nom est requis"),
  reference: z.string().min(3, "La référence est requise"),
  packaging: z.string().min(1, "Précisez le conditionnement"),
  lot_number: z.string().min(1, "N° de lot requis"),
  expiry_date: z.string().min(1, "Date d'expiration requise"),
  current_stock: z.coerce.number().min(0),
  min_stock: z.coerce.number().min(1),
  unit: z.string().min(1),
  supplier: z.string().optional(),
  purchase_cost: z.coerce.number().min(0),
});

type ReagentFormValues = z.infer<typeof ReagentSchema>;

interface CreateReagentFormProps {
  onSuccess: () => void;
}

const CreateReagentForm: React.FC<CreateReagentFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { user } = useAuth();

  const form = useForm<ReagentFormValues>({
    resolver: zodResolver(ReagentSchema),
    defaultValues: {
      name: "", reference: "", packaging: "", lot_number: "",
      expiry_date: "", current_stock: 0, min_stock: 1,
      unit: "Unité", supplier: "", purchase_cost: 0,
    },
  });

  const onSubmit = async (data: ReagentFormValues) => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.from('lab_reagents').insert({
        user_id: user.id,
        name: data.name,
        reference: data.reference,
        packaging: data.packaging,
        lot_number: data.lot_number,
        expiry_date: data.expiry_date,
        current_stock: data.current_stock,
        min_stock: data.min_stock,
        unit: data.unit,
        supplier: data.supplier,
        purchase_cost: data.purchase_cost,
      });

      if (error) throw error;
      showSuccess(`Réactif "${data.name}" enregistré.`);
      form.reset();
      onSuccess();
    } catch (err: any) {
      showError(`Erreur: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="reference" render={({ field }) => (
            <FormItem><FormLabel>Référence</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="lot_number" render={({ field }) => (
            <FormItem><FormLabel>N° de Lot</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="expiry_date" render={({ field }) => (
            <FormItem><FormLabel>Date d'Expiration</FormLabel><FormControl><Input type="date" {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="current_stock" render={({ field }) => (
            <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="min_stock" render={({ field }) => (
            <FormItem><FormLabel>Alerte Min.</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="unit" render={({ field }) => (
            <FormItem><FormLabel>Unité</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
        </div>
        <Button type="submit" className="w-full bg-blue-600 h-12 rounded-xl mt-4" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <FlaskConical className="mr-2" />}
          Enregistrer
        </Button>
      </form>
    </Form>
  );
};

export default CreateReagentForm;