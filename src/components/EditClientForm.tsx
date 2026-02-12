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
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

const ClientSchema = z.object({
  name: z.string().min(3, "Le nom du site est requis"),
  address: z.string().min(5, "L'adresse est requise"),
  city: z.string().min(2, "La ville est requise"),
  contactName: z.string().min(2, "Le nom du contact est requis"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
});

type ClientFormValues = z.infer<typeof ClientSchema>;

interface Client {
  id: string;
  name: string;
  address: string;
  city: string;
  contact_name: string;
  phone: string;
}

interface EditClientFormProps {
  client: Client;
  onSuccess: () => void;
}

const EditClientForm: React.FC<EditClientFormProps> = ({ client, onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(ClientSchema),
    defaultValues: {
      name: client.name,
      address: client.address,
      city: client.city,
      contactName: client.contact_name,
      phone: client.phone,
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    setIsLoading(true);

    const { error } = await supabase
      .from('clients')
      .update({
        name: data.name,
        address: data.address,
        city: data.city,
        contact_name: data.contactName,
        phone: data.phone,
      })
      .eq('id', client.id);

    setIsLoading(false);

    if (error) {
      console.error("Erreur mise à jour client:", error);
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess(`Le site "${data.name}" a été mis à jour.`);
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
              <FormLabel>Nom de la Clinique / Site</FormLabel>
              <FormControl><Input {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse</FormLabel>
              <FormControl><Input {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ville</FormLabel>
              <FormControl><Input {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Principal</FormLabel>
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

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl mt-4" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
          Enregistrer les modifications
        </Button>
      </form>
    </Form>
  );
};

export default EditClientForm;