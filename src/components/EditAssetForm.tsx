import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, Save, User } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

const AssetSchema = z.object({
  name: z.string().min(3, "Le nom est requis."),
  category: z.string().min(1, "La catégorie est requise."),
  status: z.enum(['Opérationnel', 'Maintenance', 'En Panne']),
  description: z.string().optional(),
  serialNumber: z.string().min(1, "Le numéro de série est requis."),
  model: z.string().min(1, "Le modèle est requis."),
  brand: z.string().min(1, "La marque est requise."),
  manufacturer: z.string().min(1, "Le fabricant est requis."),
  location: z.string().min(1, "Le site est requis."),
  assignedTo: z.string().optional().nullable(),
  manufacturingDate: z.date({
    required_error: "La date de fabrication est requise.",
  }),
  commissioningDate: z.date({
    required_error: "La date de mise en service est requise.",
  }),
  expiryDate: z.date().optional().nullable(),
  purchaseCost: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'number') return val;
    return parseFloat(val) || 0;
  }),
});

type AssetFormValues = z.infer<typeof AssetSchema>;

interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'Opérationnel' | 'Maintenance' | 'En Panne';
  serialNumber: string;
  model: string;
  brand?: string;
  manufacturer: string;
  manufacturingDate?: Date;
  commissioningDate: Date;
  expiryDate?: Date | null;
  purchaseCost: number;
  description?: string;
  assigned_to?: string | null;
}

interface EditAssetFormProps {
  asset: Asset;
  onSuccess: () => void;
}

const EditAssetForm: React.FC<EditAssetFormProps> = ({ asset, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [techs, setTechs] = useState<{id: string, name: string}[]>([]);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(AssetSchema),
    defaultValues: {
      name: asset.name,
      category: asset.category || "Non classé",
      status: asset.status,
      description: asset.description || "",
      serialNumber: asset.serialNumber,
      model: asset.model,
      brand: asset.brand || "",
      manufacturer: asset.manufacturer,
      location: asset.location,
      assignedTo: asset.assigned_to || "none",
      manufacturingDate: asset.manufacturingDate || new Date(),
      commissioningDate: asset.commissioningDate,
      expiryDate: asset.expiryDate,
      purchaseCost: asset.purchaseCost,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientData } = await supabase.from('clients').select('id, name');
      setClients(clientData || []);
      
      const { data: techData } = await supabase.from('profil').select('id, first_name, last_name');
      setTechs(techData?.map(t => ({ id: t.id, name: `${t.first_name} ${t.last_name}` })) || []);
    };
    fetchData();
  }, []);

  const onSubmit = async (data: AssetFormValues) => {
    setIsLoading(true);

    const { error } = await supabase
      .from('assets')
      .update({
        name: data.name,
        category: data.category,
        status: data.status,
        description: data.description,
        serial_number: data.serialNumber,
        model: data.model,
        brand: data.brand,
        manufacturer: data.manufacturer,
        location: data.location,
        assigned_to: data.assignedTo === "none" ? null : data.assignedTo,
        manufacturing_date: format(data.manufacturingDate, 'yyyy-MM-dd'),
        commissioning_date: format(data.commissioningDate, 'yyyy-MM-dd'),
        expiry_date: data.expiryDate ? format(data.expiryDate, 'yyyy-MM-dd') : null,
        purchase_cost: data.purchaseCost,
      })
      .eq('id', asset.id);

    setIsLoading(false);

    if (error) {
      console.error("Update error:", error);
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess("Mise à jour réussie !");
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Opérationnel">Opérationnel</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="En Panne">En Panne</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><User size={14} className="mr-1" /> Responsable Actuel</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Non assigné" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">-- Aucun --</SelectItem>
                    {techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site / Localisation</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choisir un site" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marque</FormLabel>
                <FormControl><Input {...field} className="rounded-xl" /></FormControl>
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
                <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° de Série</FormLabel>
                <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modèle</FormLabel>
                <FormControl><Input {...field} className="rounded-xl" /></FormControl>
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
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea {...field} className="rounded-xl resize-none" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4 pb-4">
          <FormField
            control={form.control}
            name="commissioningDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Mise en service</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className="rounded-xl flex justify-between font-normal">
                        {field.value ? format(field.value, "dd/MM/yyyy") : "Choisir"}
                        <CalendarIcon size={16} className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="purchaseCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coût (FCFA)</FormLabel>
                <FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value)} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full bg-blue-600 rounded-xl mt-4" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} 
          Enregistrer les modifications
        </Button>
      </form>
    </Form>
  );
};

export default EditAssetForm;