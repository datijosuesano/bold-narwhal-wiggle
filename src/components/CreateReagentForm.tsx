"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, FlaskConical, Calendar as CalendarIcon, Package } from "lucide-react";
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
  name: z.string().min(3, "Le nom du réactif est requis"),
  reference: z.string().min(3, "La référence est requise"),
  packaging: z.string().min(1, "Précisez le conditionnement (ex: Flacon 500ml)"),
  lot_number: z.string().min(1, "N° de lot requis"),
  expiry_date: z.string().min(1, "Date d'expiration requise"),
  current_stock: z.coerce.number().min(0, "Le stock doit être positif ou nul"),
  min_stock: z.coerce.number().min(1, "Le stock minimum doit être au moins 1"),
  unit: z.string().min(1, "L'unité est requise (ex: Unité, ml)"),
  supplier: z.string().optional(),
  purchase_cost: z.coerce.number().min(0, "Le coût doit être positif"),
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
      name: "",
      reference: "",
      packaging: "",
      lot_number: "",
      expiry_date: "",
      current_stock: 0,
      min_stock: 1,
      unit: "Unité",
      supplier: "",
      purchase_cost: 0,
    },
  });

  const onSubmit = async (data: ReagentFormValues) => {
    if (!user) {
      showError("Utilisateur non authentifié.");
      return;
    }
    
    setIsLoading(true);

    // Gestion du user_id pour le mode démo
    const userId = user.id.includes('fake') ? null : user.id;

    try {
      const { error } = await supabase
        .from('lab_reagents')
        .insert({
          user_id: userId,
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

      showSuccess(`Réactif "${data.name}" (${data.packaging}) enregistré.`);
      form.reset();
      onSuccess();
    } catch (err: any) {
      console.error("Erreur enregistrement réactif:", err);
      showError(`Erreur: ${err.message || "Impossible d'enregistrer"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Nom du Réactif</FormLabel><FormControl><Input placeholder="Ex: Ethanol" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="packaging" render={({ field }) => (
            <FormItem><FormLabel>Conditionnement</FormLabel><FormControl><Input placeholder="Ex: Flacon 500ml" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="reference" render={({ field }) => (
            <FormItem><FormLabel>Référence</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="lot_number" render={({ field }) => (
            <FormItem><FormLabel>N° de Lot</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="expiry_date" render={({ field }) => (
            <FormItem><FormLabel>Date d'Expiration</FormLabel><FormControl><Input type="date" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="supplier" render={({ field }) => (
            <FormItem><FormLabel>Fournisseur</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border">
          <FormField control={form.control} name="current_stock" render={({ field }) => (
            <FormItem><FormLabel>Stock Initial</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="min_stock" render={({ field }) => (
            <FormItem><FormLabel>Alerte Min.</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="unit" render={({ field }) => (
            <FormItem><FormLabel>Unité</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
        </div>

        <div className="sticky bottom-0 bg-background pt-4">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <FlaskConical className="mr-2" size={18} />}
            Enregistrer le Réactif
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateReagentForm;