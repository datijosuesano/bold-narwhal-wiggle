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
import { Textarea } from "@/components/ui/textarea";
import { showSuccess } from "@/utils/toast";

const PartSchema = z.object({
  name: z.string().min(3, "Le nom de la pièce est requis"),
  reference: z.string().min(5, "La référence est requise"),
  quantity: z.preprocess(
    (a) => parseInt(z.string().min(1).parse(a), 10),
    z.number().int().min(0, "La quantité doit être positive ou nulle")
  ),
  minQuantity: z.preprocess(
    (a) => parseInt(z.string().min(1).parse(a), 10),
    z.number().int().min(0, "Le minimum doit être positif ou nul")
  ),
  location: z.string().min(2, "La localisation est requise"),
  category: z.string().min(2, "La catégorie est requise"),
});

type PartFormValues = z.infer<typeof PartSchema>;

interface CreatePartFormProps {
  onSuccess: () => void;
}

const CreatePartForm: React.FC<CreatePartFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<PartFormValues>({
    resolver: zodResolver(PartSchema),
    defaultValues: {
      name: "",
      reference: "",
      quantity: 0,
      minQuantity: 1,
      location: "",
      category: "",
    },
  });

  const onSubmit = (data: PartFormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showSuccess(`Pièce "${data.name}" ajoutée à l'inventaire.`);
      form.reset();
      onSuccess();
    }, 1500);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de la Pièce</FormLabel>
              <FormControl><Input placeholder="Ex: Roulement à billes 6205" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Référence Fabricant</FormLabel>
              <FormControl><Input placeholder="Ex: SKF-6205-ZZ" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantité en Stock</FormLabel>
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
            name="minQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantité Minimum</FormLabel>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localisation (Rayon)</FormLabel>
                <FormControl><Input placeholder="Ex: Rayon B-04" {...field} className="rounded-xl" /></FormControl>
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
                <FormControl><Input placeholder="Ex: Mécanique, Électrique..." {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl mt-4" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Box className="mr-2" size={18} />}
          Enregistrer la Pièce
        </Button>
      </form>
    </Form>
  );
};

export default CreatePartForm;