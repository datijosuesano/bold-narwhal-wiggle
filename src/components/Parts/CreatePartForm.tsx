"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Box } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { PartSchema, PartFormValues } from "./schema";
import { partService } from "./partService";

interface CreatePartFormProps {
  onSuccess: () => void;
}

const CreatePartForm: React.FC<CreatePartFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm<PartFormValues>({
    resolver: zodResolver(PartSchema),
    defaultValues: { 
      name: "", reference: "", quantity: 0, minQuantity: 1, purchaseCost: 0,
      location: "Magasin Central", supplier: "", compatible_equipment: "",
    },
  });

  const onSubmit = async (data: PartFormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await partService.createPart(data, user.id);
      showSuccess(`Pièce "${data.name}" ajoutée.`);
      form.reset();
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
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Désignation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="reference" render={({ field }) => (
            <FormItem><FormLabel>Référence</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem><FormLabel>Localisation</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="supplier" render={({ field }) => (
            <FormItem><FormLabel>Fournisseur</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="compatible_equipment" render={({ field }) => (
          <FormItem><FormLabel>Compatibilité</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
        )} />

        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem><FormLabel>Stock Initial</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="minQuantity" render={({ field }) => (
            <FormItem><FormLabel>Seuil Alerte</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
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