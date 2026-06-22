"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Building2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const CustomerSchema = z.object({
  name: z.string().min(3, "Le nom de la structure est requis (3 car. min)"),
  contact_email: z.string().email("Email invalide").or(z.literal("")),
  contact_phone: z.string().min(10, "Numéro de téléphone invalide").or(z.literal("")),
  address: z.string().optional().default(""),
  credit_limit: z.coerce.number().min(0, "La limite de crédit doit être positive"),
  payment_terms: z.string().min(1, "Veuillez sélectionner les conditions de paiement"),
  is_active: z.boolean().default(true),
});

type CustomerFormValues = z.infer<typeof CustomerSchema>;

interface CustomerFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerToEdit?: any | null;
}

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerToEdit,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      name: "",
      contact_email: "",
      contact_phone: "",
      address: "",
      credit_limit: 0,
      payment_terms: "Comptant",
      is_active: true,
    },
  });

  // Reset form values when dialog opens or customerToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (customerToEdit) {
        form.reset({
          name: customerToEdit.name || "",
          contact_email: customerToEdit.email || "", // <-- Lire depuis email
          contact_phone: customerToEdit.phone || "", // <-- Lire depuis phone
          address: customerToEdit.address || "",
          credit_limit: customerToEdit.credit_limit || 0,
          payment_terms: customerToEdit.payment_terms || "Comptant",
          is_active: customerToEdit.is_active !== false,
        });
      } else {
        form.reset({
          name: "",
          contact_email: "",
          contact_phone: "",
          address: "",
          credit_limit: 0,
          payment_terms: "Comptant",
          is_active: true,
        });
      }
    }
  }, [isOpen, customerToEdit, form]);

  const onSubmit = async (data: CustomerFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        name: data.name,
        email: data.contact_email || null, // <-- Remplacer contact_email par email
        phone: data.contact_phone || null, // <-- Remplacer contact_phone par phone
        address: data.address || null,
        credit_limit: data.credit_limit,
        payment_terms: data.payment_terms,
        is_active: data.is_active,
      }; 

      if (customerToEdit) {
        // Mode Édition
        const { error } = await supabase
          .from("reagent_customers")
          .update(payload)
          .eq("id", customerToEdit.id);

        if (error) throw error;
        showSuccess(`Le client "${data.name}" a été mis à jour.`);
      } else {
        // Mode Création
        const { error } = await supabase
          .from("reagent_customers")
          .insert({
            ...payload,
            current_debt: 0, // Initialisation de la dette à 0
          });

        if (error) throw error;
        showSuccess(`Le client "${data.name}" a été créé avec succès.`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erreur enregistrement client:", err);
      showError(`Erreur : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Building2 className="text-indigo-600" size={20} />
            {customerToEdit ? "Modifier le Client" : "Nouveau Client Réactifs"}
          </DialogTitle>
          <DialogDescription>
            Configurez les informations de facturation et de recouvrement du client.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la Structure / Laboratoire</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Laboratoire Central d'Abidjan" {...field} className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="01XXXXXXXX" {...field} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de contact</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@lab.com" {...field} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse de livraison</FormLabel>
                  <FormControl>
                    <Input placeholder="Rue, Ville, Commune..." {...field} className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="credit_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Crédit (FCFA)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} className="rounded-xl font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conditions de paiement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Paiement immédiat">Comptant / Immédiat</SelectItem>
                        <SelectItem value="30 jours fin de mois">30 jours fin de mois</SelectItem>
                        <SelectItem value="45 jours fin de mois">45 jours fin de mois</SelectItem>
                        <SelectItem value="60 jours fin de mois">60 jours fin de mois</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border bg-slate-50 p-3">
                  <div>
                    <FormLabel className="text-xs font-bold uppercase text-slate-700 block">Compte Actif</FormLabel>
                    <span className="text-[10px] text-muted-foreground">Autoriser les commandes de réactifs</span>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold shadow-lg mt-4" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
              {customerToEdit ? "Sauvegarder les modifications" : "Créer le Client"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerFormDialog;