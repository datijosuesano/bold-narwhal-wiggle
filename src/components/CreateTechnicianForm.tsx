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
import { showSuccess } from "@/utils/toast";

const TechnicianSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  specialty: z.string().min(1, "Veuillez sélectionner une spécialité"),
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
      name: "",
      email: "",
      phone: "",
      specialty: "",
    },
  });

  const onSubmit = (data: TechnicianFormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showSuccess(`Technicien ${data.name} ajouté à l'équipe !`);
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
              <FormLabel>Nom Complet</FormLabel>
              <FormControl><Input placeholder="Ex: Paul Martin" {...field} className="rounded-xl" /></FormControl>
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
                <FormLabel>Email Professionnel</FormLabel>
                <FormControl><Input placeholder="p.martin@clinique.fr" {...field} className="rounded-xl" /></FormControl>
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
                <FormControl><Input placeholder="06XXXXXXXX" {...field} className="rounded-xl" /></FormControl>
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
                    <SelectValue placeholder="Sélectionner une spécialité" />
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
          {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <UserPlus className="mr-2" size={18} />}
          Recruter le Technicien
        </Button>
      </form>
    </Form>
  );
};

export default CreateTechnicianForm;