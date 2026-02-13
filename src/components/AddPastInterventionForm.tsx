"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle2, Package } from "lucide-react";
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
  title: z.string().min(5, "Le titre est requis."),
  description: z.string().min(10, "Veuillez décrire l'action menée."),
  maintenanceType: z.enum(["Preventive", "Corrective", "Palliative", "Ameliorative"]),
  date: z.string().min(1, "La date est requise."),
  partId: z.string().optional(),
  partQuantity: z.preprocess((a) => (a === "" ? 0 : parseInt(z.string().parse(a), 10)), z.number().min(0)),
});

type InterventionFormValues = z.infer<typeof InterventionSchema>;

interface AddPastInterventionFormProps {
  assetId: string;
  onSuccess: () => void;
}

const AddPastInterventionForm: React.FC<AddPastInterventionFormProps> = ({ assetId, onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [spareParts, setSpareParts] = useState<{id: string, name: string, current_stock: number}[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchParts = async () => {
      const { data } = await supabase.from('spare_parts').select('id, name, current_stock').gt('current_stock', 0);
      setSpareParts(data || []);
    };
    fetchParts();
  }, []);

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      title: "",
      description: "",
      maintenanceType: "Corrective",
      date: format(new Date(), "yyyy-MM-dd"),
      partId: "none",
      partQuantity: 0,
    },
  });

  const onSubmit = async (data: InterventionFormValues) => {
    if (!user) return;
    setIsLoading(true);

    // 1. Enregistrement de l'intervention
    const { error: otError } = await supabase.from('work_orders').insert({
      user_id: user.id,
      asset_id: assetId,
      title: data.title,
      description: data.description,
      maintenance_type: data.maintenanceType,
      due_date: data.date,
      status: 'Completed',
      parts_replaced: data.partId !== "none" && data.partQuantity > 0,
      priority: 'Medium'
    });

    if (otError) {
      showError(`Erreur: ${otError.message}`);
      setIsLoading(false);
      return;
    }

    // 2. Déduction de stock si une pièce est utilisée
    if (data.partId && data.partId !== "none" && data.partQuantity > 0) {
      const selectedPart = spareParts.find(p => p.id === data.partId);
      if (selectedPart) {
        const newStock = Math.max(0, selectedPart.current_stock - data.partQuantity);
        const { error: stockError } = await supabase
          .from('spare_parts')
          .update({ current_stock: newStock })
          .eq('id', data.partId);
        
        if (stockError) showError("Erreur lors de la mise à jour du stock.");
      }
    }

    setIsLoading(false);
    showSuccess("Intervention et stock mis à jour !");
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Objet</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="date" render={({ field }) => (
            <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="maintenanceType" render={({ field }) => (
            <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Preventive">Préventive</SelectItem><SelectItem value="Corrective">Corrective</SelectItem></SelectContent></Select></FormItem>
          )} />
        </div>

        <div className="p-4 bg-blue-50/50 border rounded-xl space-y-4">
          <div className="flex items-center text-sm font-bold text-blue-700 mb-2"><Package size={16} className="mr-2" /> Utilisation de pièce</div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="partId" render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir une pièce" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">-- Aucune pièce --</SelectItem>
                    {spareParts.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} (Dispo: {p.current_stock})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="partQuantity" render={({ field }) => (
              <FormItem>
                <FormControl><Input type="number" placeholder="Qté utilisée" {...field} className="rounded-xl" /></FormControl>
              </FormItem>
            )} />
          </div>
        </div>

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Détails</FormLabel><FormControl><Textarea {...field} className="rounded-xl h-24" /></FormControl></FormItem>
        )} />

        <Button type="submit" className="w-full bg-green-600 rounded-xl" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="mr-2" />} Enregistrer
        </Button>
      </form>
    </Form>
  );
};

export default AddPastInterventionForm;