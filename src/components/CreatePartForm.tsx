"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Box } from "lucide-react";

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
  name: z.string().min(3, "Le nom de la pièce est requis"),
  reference: z.string().min(3, "La référence est requise"),
  // Coerce permet de convertir automatiquement le texte de l'input en nombre
  quantity: z.coerce.number().min(0, "Le stock doit être positif"),
  minQuantity: z.coerce.number().min(0, "Le seuil doit être positif"),
  location: z.string().optional(),
  category: z.string().optional(),
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
      location: "", 
      category: "Mécanique" 
    },
  });

  const onSubmit = async (data: PartFormValues) => {
    if (!user) {
      showError("Session utilisateur introuvable.");
      return;
    }
    
    setIsLoading(true);

    try {
      const { error } = await supabase.from('spare_parts').insert({
        user_id: user.id.includes('fake') ? null : user.id,
        name: data.name,
        reference: data.reference,
        current_stock: data.quantity,
        min_stock: data.minQuantity,
        location: data.location,
        category: data.category
      });

      if (error) {
        throw error;
      }

      showSuccess(`Pièce "${data.name}" ajoutée au stock.`);
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("[CreatePartForm] Erreur:", error);
      showError(`Erreur: ${error.message || "Impossible d'enregistrer"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      {/* On s'assure que le bouton est de type submit et déclenche form.handleSubmit */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Désignation</FormLabel>
            <FormControl><Input placeholder="Ex: Filtre à air" {...field} className="rounded-xl" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <FormField control={form.control} name="reference" render={({ field }) => (
          <FormItem>
            <FormLabel>Référence</FormLabel>
            <FormControl><Input placeholder="Ex: REF-12345" {...field} className="rounded-xl" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem>
              <FormLabel>Stock Actuel</FormLabel>
              <FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="minQuantity" render={({ field }) => (
            <FormItem>
              <FormLabel>Seuil Alerte</FormLabel>
              <FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl mt-4 shadow-md py-6 text-lg font-bold" 
          disabled={isLoading}
        >
          {isLoading ? (
            <><Loader2 className="animate-spin mr-2" /> Traitement...</>
          ) : (
            <><Box className="mr-2" size={20} /> Enregistrer la pièce</>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default CreatePartForm;