"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save } from "lucide-react";

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

const PartSchema = z.object({
  name: z.string().min(3, "Le nom est requis"),
  reference: z.string().min(3, "La référence est requise"),
  quantity: z.coerce.number().min(0, "Le stock doit être positif"),
  minQuantity: z.coerce.number().min(0, "Le seuil doit être positif"),
  location: z.string().min(1, "La localisation est requise"),
  category: z.string().min(1, "La catégorie est requise"),
});

type PartFormValues = z.infer<typeof PartSchema>;

interface Part {
  id: string;
  name: string;
  reference: string;
  current_stock: number;
  min_stock: number;
  location: string;
  category: string;
}

interface EditPartFormProps {
  part: Part;
  onSuccess: () => void;
}

const EditPartForm: React.FC<EditPartFormProps> = ({ part, onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<PartFormValues>({
    resolver: zodResolver(PartSchema),
    defaultValues: { 
      name: part.name, 
      reference: part.reference, 
      quantity: part.current_stock, 
      minQuantity: part.min_stock, 
      location: part.location || "", 
      category: part.category || "" 
    },
  });

  const onSubmit = async (data: PartFormValues) => {
    setIsLoading(true);

    const { error } = await supabase
      .from('spare_parts')
      .update({
        name: data.name,
        reference: data.reference,
        current_stock: data.quantity,
        min_stock: data.minQuantity,
        location: data.location,
        category: data.category
      })
      .eq('id', part.id);

    setIsLoading(false);

    if (error) {
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess(`Pièce mise à jour.`);
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Désignation</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="reference" render={({ field }) => (
            <FormItem>
              <FormLabel>Référence</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel>Emplacement / Casier</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem>
              <FormLabel>Stock Actuel</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="minQuantity" render={({ field }) => (
            <FormItem>
              <FormLabel>Seuil Alerte</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <Button type="submit" className="w-full bg-blue-600 rounded-xl mt-4" disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="animate-spin mr-2" /> Mise à jour...</>
          ) : (
            <><Save className="mr-2" size={18} /> Sauvegarder les modifications</>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default EditPartForm;