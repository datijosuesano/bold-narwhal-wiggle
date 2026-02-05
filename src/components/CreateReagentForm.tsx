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
  name: z.string().min(3, "Le nom du réactif est requis"),
  reference: z.string().min(5, "La référence est requise"),
  current_stock: z.preprocess(
    (a) => parseInt(z.string().min(1).parse(a), 10),
    z.number().int().min(0, "Le stock doit être positif ou nul")
  ),
  min_stock: z.preprocess(
    (a) => parseInt(z.string().min(1).parse(a), 10),
    z.number().int().min(1, "Le stock minimum doit être au moins 1")
  ),
  unit: z.string().min(1, "L'unité est requise (ex: ml, g)"),
  supplier: z.string().optional(),
  purchase_cost: z.preprocess(
    (a) => parseFloat(z.string().min(1).parse(a)),
    z.number().positive("Le coût doit être positif.")
  ),
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
      current_stock: 0,
      min_stock: 1,
      unit: "ml",
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

    const { error } = await supabase
      .from('lab_reagents')
      .insert({
        ...data,
        user_id: user.id,
      });

    setIsLoading(false);

    if (error) {
      console.error("Erreur lors de la création du réactif:", error);
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess(`Réactif "${data.name}" ajouté au stock.`);
      form.reset();
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
              <FormLabel>Nom du Réactif</FormLabel>
              <FormControl><Input placeholder="Ex: Acide Sulfurique" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Référence / Code Produit</FormLabel>
              <FormControl><Input placeholder="Ex: RGT-H2SO4-001" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="current_stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Actuel</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value)}
                    className="rounded-xl" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="min_stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Min.</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="1" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value)}
                    className="rounded-xl" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unité</FormLabel>
                <FormControl><Input placeholder="ml, g, flacon..." {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fournisseur (Optionnel)</FormLabel>
                <FormControl><Input placeholder="Ex: Sigma Aldrich" {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="purchase_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coût d'Achat (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value)}
                    className="rounded-xl" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl mt-4" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <FlaskConical className="mr-2" size={18} />}
          Enregistrer le Réactif
        </Button>
      </form>
    </Form>
  );
};

export default CreateReagentForm;