import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

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
import { showSuccess } from "@/utils/toast";

// 1. Définition du schéma de validation
const AssetSchema = z.object({
  name: z.string().min(3, {
    message: "Le nom doit contenir au moins 3 caractères.",
  }),
  description: z.string().min(10, {
    message: "La description est trop courte.",
  }),
  location: z.string().min(2, {
    message: "La localisation est requise.",
  }),
  purchaseCost: z.preprocess(
    (a) => parseFloat(z.string().min(1).parse(a)),
    z.number().positive({ message: "Le coût doit être positif." })
  ),
});

type AssetFormValues = z.infer<typeof AssetSchema>;

interface CreateAssetFormProps {
  onSuccess: () => void;
}

const CreateAssetForm: React.FC<CreateAssetFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(AssetSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      purchaseCost: 0,
    },
  });

  const onSubmit = (data: AssetFormValues) => {
    setIsLoading(true);
    console.log("Nouvel Équipement soumis:", data);

    // Simuler une requête API
    setTimeout(() => {
      setIsLoading(false);
      showSuccess("Équipement créé avec succès !");
      form.reset();
      onSuccess(); // Ferme le modal
    }, 1500);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l'équipement</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Pompe centrifuge P-101" {...field} className="rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description / Spécifications</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Modèle, numéro de série, spécifications techniques..."
                  className="resize-none rounded-xl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Champ Localisation */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localisation</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Atelier Nord, Zone 3" {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Champ Coût d'achat */}
          <FormField
            control={form.control}
            name="purchaseCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coût d'achat (€)</FormLabel>
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

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Ajouter l'Équipement"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default CreateAssetForm;