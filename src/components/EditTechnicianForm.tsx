"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save } from "lucide-react";

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
import { Technician } from "./TechniciansTable";

const TechnicianSchema = z.object({
  first_name: z.string().min(2, "Le prénom est requis"),
  last_name: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(10, "Numéro de téléphone invalide"),
  specialite: z.string().min(1, "Veuillez sélectionner une spécialité"),
  role: z.string().min(1, "Le rôle est requis"),
});

type TechnicianFormValues = z.infer<typeof TechnicianSchema>;

interface EditTechnicianFormProps {
  technician: Technician;
  onSuccess: () => void;
}

const EditTechnicianForm: React.FC<EditTechnicianFormProps> = ({ technician, onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const nameParts = technician.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const form = useForm<TechnicianFormValues>({
    resolver: zodResolver(TechnicianSchema),
    defaultValues: {
      first_name: firstName,
      last_name: lastName,
      email: technician.email === 'N/A' ? '' : technician.email,
      telephone: technician.phone === 'N/A' ? '' : technician.phone,
      specialite: technician.specialty,
      role: technician.specialty === 'Nouveau compte' ? 'technicien biomedical' : (technician.specialty.toLowerCase().includes('stock') ? 'gestionnaire de stock' : 'technicien biomedical'),
    },
  });

  const onSubmit = async (data: TechnicianFormValues) => {
    setIsLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        telephone: data.telephone,
        specialite: data.specialite,
        role: data.role,
      })
      .eq('id', technician.id);

    setIsLoading(false);

    if (error) {
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess(`Profil mis à jour.`);
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl><Input {...field} className="rounded-xl" /></FormControl>
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
                <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="specialite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spécialité technique</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Biomédical">Biomédical</SelectItem>
                    <SelectItem value="Imagerie">Imagerie</SelectItem>
                    <SelectItem value="Laboratoire">Laboratoire</SelectItem>
                    <SelectItem value="Froid Médical">Froid Médical</SelectItem>
                    <SelectItem value="Gestion Stock">Gestion Stock</SelectItem>
                    <SelectItem value="Administratif">Administratif</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rôle (Droits d'accès)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="technicien biomedical">Technicien Biomédical</SelectItem>
                    <SelectItem value="gestionnaire de stock">Gestionnaire de Stock</SelectItem>
                    <SelectItem value="secretaire">Secrétaire</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="sticky bottom-0 bg-background pt-2 pb-1">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg h-12 font-bold" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditTechnicianForm;