"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Hammer } from "lucide-react";
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

const ToolSchema = z.object({
  name: z.string().min(3, "Le nom est requis"),
  serial_number: z.string().min(2, "N° de série requis"),
  category: z.string().min(2, "La catégorie est requise"),
});

type ToolFormValues = z.infer<typeof ToolSchema>;

interface CreateToolFormProps {
  onSuccess: () => void;
}

const CreateToolForm: React.FC<CreateToolFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { user } = useAuth();

  const form = useForm<ToolFormValues>({
    resolver: zodResolver(ToolSchema),
    defaultValues: {
      name: "",
      serial_number: "",
      category: "Outillage",
    },
  });

  const onSubmit = async (data: ToolFormValues) => {
    if (!user) return;
    setIsLoading(true);

    const { error } = await supabase.from('tools').insert({
      ...data,
      user_id: user.id,
      status: 'Disponible'
    });

    setIsLoading(false);

    if (error) {
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess(`Outil "${data.name}" ajouté.`);
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l'outil</FormLabel>
              <FormControl><Input placeholder="Ex: Multimètre Fluke" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="serial_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de série / Réf</FormLabel>
              <FormControl><Input placeholder="Ex: SN-88293" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <FormControl><Input placeholder="Ex: Mesure, EPI..." {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-blue-600 rounded-xl mt-4" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Hammer className="mr-2" size={18} />}
          Enregistrer l'outil
        </Button>
      </form>
    </Form>
  );
};

export default CreateToolForm;