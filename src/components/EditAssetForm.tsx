import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { showSuccess } from "@/utils/toast";

// Définition du schéma de validation (réutilisé)
const AssetSchema = z.object({
  name: z.string().min(3, {
    message: "Le nom doit contenir au moins 3 caractères.",
  }),
  description: z.string().min(10, {
    message: "La description est trop courte.",
  }),
  serialNumber: z.string().min(1, {
    message: "Le numéro de série est requis.",
  }),
  model: z.string().min(1, {
    message: "Le modèle est requis.",
  }),
  manufacturer: z.string().min(1, {
    message: "Le fabricant est requis.",
  }),
  location: z.string().min(2, {
    message: "La localisation est requise.",
  }),
  commissioningDate: z.date({
    required_error: "La date de mise en service est requise.",
  }),
  purchaseCost: z.preprocess(
    (a) => parseFloat(z.string().min(1).parse(a)),
    z.number().positive({ message: "Le coût doit être positif." })
  ),
});

type AssetFormValues = z.infer<typeof AssetSchema>;

interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'Opérationnel' | 'Maintenance' | 'En Panne';
  serialNumber: string; // Rendu obligatoire
  model: string; // Rendu obligatoire
  manufacturer: string; // Rendu obligatoire
  commissioningDate: Date; // Rendu obligatoire
  purchaseCost: number; // Rendu obligatoire
}

interface EditAssetFormProps {
  asset: Asset;
  onSuccess: () => void;
}

const EditAssetForm: React.FC<EditAssetFormProps> = ({ asset, onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  // Préparation des valeurs par défaut pour le formulaire
  // Nous utilisons les valeurs de l'actif directement, car elles sont maintenant garanties par le type Asset
  const defaultValues: AssetFormValues = {
    name: asset.name,
    description: "Description détaillée de l'équipement " + asset.name, // Placeholder for missing data
    serialNumber: asset.serialNumber,
    model: asset.model,
    manufacturer: asset.manufacturer,
    location: asset.location,
    commissioningDate: asset.commissioningDate,
    purchaseCost: asset.purchaseCost,
  };

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(AssetSchema),
    defaultValues: defaultValues,
  });

  // Assurez-vous que le coût est affiché correctement si c'est un nombre
  React.useEffect(() => {
    // Utiliser setValue pour s'assurer que le formulaire est synchronisé si l'actif change
    form.reset(defaultValues);
  }, [asset.id]);


  const onSubmit = (data: AssetFormValues) => {
    setIsLoading(true);
    console.log(`Modification de l'équipement ${asset.id} soumise:`, data);

    // Simuler une requête API
    setTimeout(() => {
      setIsLoading(false);
      showSuccess(`Équipement "${data.name}" mis à jour avec succès !`);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Champ Numéro de série */}
          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de série</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: SN-456789" {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Champ Modèle */}
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modèle</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: CentriMax 3000" {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Champ Fabricant */}
          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fabricant</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: TechCorp Industries" {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description / Spécifications</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Spécifications techniques, notes importantes..."
                  className="resize-none rounded-xl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Champ Date de mise en service */}
          <FormField
            control={form.control}
            name="commissioningDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de mise en service</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-xl",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Choisir une date</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                    value={field.value === 0 ? '' : field.value} // Afficher vide si 0 pour l'édition
                    className="rounded-xl" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 rounded-xl shadow-md" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Sauvegarder les Modifications"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default EditAssetForm;