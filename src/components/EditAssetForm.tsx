import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, Save } from "lucide-react";
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
  name: z.string().min(2, "Le nom est requis"),
  category: z.string().min(1, "La catégorie est requise"),
  status: z.enum(['Opérationnel', 'Maintenance', 'En Panne']),
  location: z.string().min(1, "Le site est requis"),
  serialNumber: z.string().optional(),
  model: z.string().optional(),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  commissioningDate: z.date().optional(),
  purchaseCost: z.coerce.number().optional(),
  assignedTo: z.string().optional().nullable(),
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
  commissioningDate: Date;
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
      category: asset.category,
      status: asset.status,
      location: asset.location,
      serialNumber: asset.serialNumber,
      model: asset.model,
      brand: asset.brand || "",
      manufacturer: asset.manufacturer,
      description: asset.description || "",
      commissioningDate: asset.commissioningDate,
      purchaseCost: asset.purchaseCost,
      assignedTo: asset.assigned_to || "none",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientData } = await supabase.from('clients').select('id, name');
      setClients(clientData || []);
      const { data: techData } = await supabase.from('profiles').select('id, first_name, last_name');
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
        location: data.location,
        serial_number: data.serialNumber,
        model: data.model,
        brand: data.brand,
        manufacturer: data.manufacturer,
        description: data.description,
        commissioning_date: data.commissioningDate ? format(data.commissioningDate, 'yyyy-MM-dd') : null,
        purchase_cost: data.purchaseCost,
        assigned_to: data.assignedTo === "none" ? null : data.assignedTo,
      })
      .eq('id', asset.id);

    setIsLoading(false);
    if (error) {
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
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>Statut</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Opérationnel">Opérationnel</SelectItem><SelectItem value="Maintenance">Maintenance</SelectItem><SelectItem value="En Panne">En Panne</SelectItem></SelectContent></Select></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem><FormLabel>Site</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></FormItem>
          )} />
          <FormField control={form.control} name="assignedTo" render={({ field }) => (
            <FormItem><FormLabel>Responsable</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || "none"}><FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">-- Aucun --</SelectItem>{techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></FormItem>
          )} />
        </div>

        <Button type="submit" className="w-full bg-blue-600 rounded-xl" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />} Enregistrer
        </Button>
      </form>
    </Form>
  );
};

export default EditAssetForm;