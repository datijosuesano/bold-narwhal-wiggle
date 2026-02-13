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
  quantity: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number().min(0)),
  minQuantity: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number().min(0)),
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
    defaultValues: { name: "", reference: "", quantity: 0, minQuantity: 1, location: "", category: "" },
  });

  const onSubmit = async (data: PartFormValues) => {
    if (!user) return;
    setIsLoading(true);

    const { error } = await supabase.from('spare_parts').insert({
      user_id: user.id,
      name: data.name,
      reference: data.reference,
      current_stock: data.quantity,
      min_stock: data.minQuantity,
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
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Désignation</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="reference" render={({ field }) => (
          <FormItem><FormLabel>Référence</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="quantity" render={({ field }) => (
            <FormItem><FormLabel>Stock Actuel</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="minQuantity" render={({ field }) => (
            <FormItem><FormLabel>Seuil Alerte</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
        </div>
        <Button type="submit" className="w-full bg-blue-600 rounded-xl" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Enregistrer la pièce"}
        </Button>
      </form>
    </Form>
  );
};

export default CreatePartForm;