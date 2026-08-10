"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";

import { PartSchema, PartFormValues } from "./schema";
import { partService } from "./partService";

interface Part {
  id: string;
  name: string;
  reference: string;
  current_stock: number;
  min_stock: number;
  purchase_cost?: number;
  location: string;
  category: string;
  supplier?: string;
  compatible_equipment?: string;
}

interface EditPartFormProps {
  part: Part;
  onSuccess: () => void;
}

const EditPartForm: React.FC<EditPartFormProps> = ({ part, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PartFormValues>({
    resolver: zodResolver(PartSchema),
    defaultValues: { 
      name: part.name, 
      reference: part.reference, 
      quantity: part.current_stock, 
      minQuantity: part.min_stock, 
      purchaseCost: part.purchase_cost || 0,
      location: part.location || "", 
      category: part.category || "",
      supplier: part.supplier || "",
      compatible_equipment: part.compatible_equipment || "",
    },
  });

  const onSubmit = async (data: PartFormValues) => {
    setIsLoading(true);
    try {
      await partService.updatePart(part.id, data);
      showSuccess("Pièce mise à jour.");
      onSuccess();
    } catch (error: any) {
      showError(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Ton JSX reste identique, le formulaire est maintenant lié au service */}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Désignation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="reference" render={({ field }) => (
            <FormItem><FormLabel>Référence</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem><FormLabel>Catégorie</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem><FormLabel>Emplacement</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="supplier" render={({ field }) => (
            <FormItem><FormLabel>Fournisseur</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="compatible_equipment" render={({ field }) => (
            <FormItem><FormLabel>Compatibilité</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
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
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
          Sauvegarder les modifications
        </Button>
      </form>
    </Form>
  );
};

export default EditPartForm;