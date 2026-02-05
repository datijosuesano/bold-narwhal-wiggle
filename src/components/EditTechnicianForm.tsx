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
import { showSuccess } from "@/utils/toast";
import { Technician } from "./TechniciansTable";

const TechnicianSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  specialty: z.string().min(1, "Veuillez sélectionner une spécialité"),
});

type TechnicianFormValues = z.infer<typeof TechnicianSchema>;

interface EditTechnicianFormProps {
  technician: Technician;
  onSuccess: () => void;
}

const EditTechnicianForm: React.FC<EditTechnicianFormProps> = ({ technician, onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<TechnicianFormValues>({
    resolver: zodResolver(TechnicianSchema),
    defaultValues: {
      name: technician.name,
      email: technician.email,
      phone: technician.phone,
      specialty: technician.specialty,
    },
  });

  const onSubmit = (data: TechnicianFormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showSuccess(`Profil de ${data.name} mis à jour.`);
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
              <FormLabel>Nom Complet</FormLabel>
              <FormControl><Input {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl><Input {...field} className="rounded-xl" /></FormControl>
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

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl mt-4" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
          Enregistrer les modifications
        </Button>
      </form>
    </Form>
  );
};

export default EditTechnicianForm;