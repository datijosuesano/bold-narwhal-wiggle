"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Box, DollarSign } from "lucide-react";

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

const PartSchema = z.object({
  name: z.string().min(3, "Le nom est requis"),
  reference: z.string().min(3, "La référence est requise"),
  quantity: z.coerce.number().min(0, "Le stock doit être positif"),
  minQuantity: z.coerce.number().min(0, "Le seuil doit être positif"),
  purchaseCost: z.coerce.number().min(0, "Le coût doit être positif"),
  location: z.string().min(1, "La localisation est requise"),
  category: z.string().min(1, "La catégorie est requise"),
});

type PartFormValues = z.infer<typeof PartSchema>;

interface CreatePartFormProps {
  onSuccess: () => void;
}

const CreatePartForm: React.FC<CreatePartFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { user } = useAuth();

  const form = useForm<PartFormValues>({
    resolver: zodResolver(PartSchema),
    defaultValues: { 
      name: "", 
      reference: "", 
      quantity: 0, 
      minQuantity: 1, 
      purchaseCost: 0,
      location: "Magasin Central", 
      category: "Mécanique" 
    },
  });

  const onSubmit = async (data: PartFormValues) => {
    if (!user) return;
    setIsLoading(true);

    const { error } = await supabase.from('spare_parts').insert({
      user_id: user.id.includes('fake') ? null : user.id,
      name: data.name,
      reference: data.reference,
      current_stock: data.quantity,
      min_stock: data.minQuantity,
      purchase_cost: data.purchaseCost,
      location: data.location,
      category: data.category
    });

    setIsLoading(false);

    if (error) {
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess(`Pièce "${data.name}" ajoutée.`);
      form.reset();
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Désignation</FormLabel><FormControl><Input placeholder="Ex: Filtre" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="reference" render={({ field }) => (
            <FormItem><FormLabel>Référence</FormLabel><FormControl><Input placeholder="Ex: REF-001" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem><FormLabel>Catégorie</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem><FormLabel>Localisation</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="minQuantity" render={({ field }) => (
            <FormItem><FormLabel>Seuil</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="purchaseCost" render={({ field }) => (
            <FormItem><FormLabel>Prix (FCFA)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
          )} />
        </div>

        <Button type="submit" className="w-full bg-blue-600 rounded-xl mt-4" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <Box className="mr-2" size={18} />}
          Enregistrer la pièce
        </Button>
      </form>
    </Form>
  );
};

export default CreatePartForm;