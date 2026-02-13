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

const CREATABLE_ROLES: { value: string, label: string }[] = [
  { value: 'technician', label: 'Technicien' },
  { value: 'stock_manager', label: 'Gestionnaire de Stock' },
  { value: 'secretary', label: 'Secrétaire' },
  { value: 'user', label: 'Utilisateur Standard' },
];

const TechnicianSchema = z.object({
  first_name: z.string().min(2, "Le prénom est requis"),
  last_name: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  specialty: z.string().min(1, "Veuillez sélectionner une spécialité"),
  role: z.enum(['technician', 'stock_manager', 'secretary', 'user'], {
    required_error: "Le rôle est requis.",
  }),
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
      phone: "",
      specialty: "",
      role: 'technician',
    },
  });

  const onSubmit = async (data: TechnicianFormValues) => {
    setIsLoading(true);
    
    const { error } = await supabase
      .from('profil')
      .insert({
        id: crypto.randomUUID(),
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        specialty: data.specialty,
        role: data.role,
        status: 'Available'
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
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
            name="phone"
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
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rôle</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CREATABLE_ROLES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="specialty"
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

        <div className="sticky bottom-0 bg-background pt-2 pb-1">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <UserPlus className="mr-2" size={18} />}
            Créer le Technicien
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateTechnicianForm;