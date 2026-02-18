"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UserPlus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

const TechnicianSchema = z.object({
  first_name: z.string().min(2, "Le prénom est requis"),
  last_name: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(10, "Numéro de téléphone invalide"),
  specialite: z.string().min(1, "Veuillez sélectionner une spécialité"),
});

type TechnicianFormValues = z.infer<typeof TechnicianSchema>;

interface CreateTechnicianFormProps {
  onSuccess: () => void;
}

const CreateTechnicianForm: React.FC<CreateTechnicianFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<TechnicianFormValues>({
    resolver: zodResolver(TechnicianSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      telephone: "",
      specialite: "Polyvalent",
    },
  });

  const onSubmit = async (data: TechnicianFormValues) => {
    setIsLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        telephone: data.telephone,
        specialite: data.specialite,
        role: 'technician',
        status: 'Disponible'
      });

    setIsLoading(false);

    if (error) {
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess(`Technicien ${data.first_name} ${data.last_name} enregistré.`);
      form.reset();
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl><Input placeholder="Ex: Paul" {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl><Input placeholder="Ex: Martin" {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Professionnel</FormLabel>
              <FormControl><Input placeholder="p.martin@clinique.fr" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl><Input placeholder="06XXXXXXXX" {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="specialite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spécialité</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Biomédical">Biomédical</SelectItem>
                    <SelectItem value="Electricien">Electricien</SelectItem>
                    <SelectItem value="Frigoriste">Frigoriste</SelectItem>
                    <SelectItem value="Plombier">Plombier</SelectItem>
                    <SelectItem value="Polyvalent">Polyvalent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg h-12 font-bold" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <UserPlus className="mr-2" size={18} />}
          Créer le Technicien
        </Button>
      </form>
    </Form>
  );
};

export default CreateTechnicianForm;