import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ImageUpload from "./ImageUpload";

const AssetSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  category: z.string().min(1, "La catégorie est requise"),
  location: z.string().min(1, "Le site est requis"),
  serialNumber: z.string().optional(),
  model: z.string().optional(),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  commissioningDate: z.date().optional(),
  purchaseCost: z.coerce.number().optional(),
  assignedTo: z.string().optional().nullable(),
});

type AssetFormValues = z.infer<typeof AssetSchema>;

interface CreateAssetFormProps {
  onSuccess: () => void;
}

const CreateAssetForm: React.FC<CreateAssetFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [techs, setTechs] = useState<{id: string, name: string}[]>([]);
  const { user } = useAuth();

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(AssetSchema),
    defaultValues: {
      name: "",
      category: "Imagerie",
      location: "",
      serialNumber: "",
      model: "",
      brand: "",
      manufacturer: "",
      description: "",
      imageUrl: "",
      commissioningDate: new Date(),
      purchaseCost: 0,
      assignedTo: "none",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientData } = await supabase.from('clients').select('id, name').order('name');
      setClients(clientData || []);
      const { data: techData } = await supabase.from('profiles').select('id, first_name, last_name').order('last_name');
      setTechs(techData?.map(t => ({ id: t.id, name: `${t.first_name} ${t.last_name}` })) || []);
    };
    fetchData();
  }, []);

  const onSubmit = async (data: AssetFormValues) => {
    if (!user) {
      showError("Session expirée. Veuillez vous reconnecter.");
      return;
    }
    
    setIsLoading(true);
    const userId = user.id.includes('fake') ? null : user.id;

    const payload = {
      user_id: userId,
      name: data.name,
      category: data.category,
      location: data.location,
      serial_number: data.serialNumber || null,
      model: data.model || null,
      brand: data.brand || null,
      manufacturer: data.manufacturer || null,
      description: data.description || null,
      image_url: data.imageUrl || null,
      commissioning_date: data.commissioningDate ? format(data.commissioningDate, 'yyyy-MM-dd') : null,
      purchase_cost: data.purchaseCost || 0,
      assigned_to: data.assignedTo === "none" ? null : data.assignedTo,
      status: 'Opérationnel'
    };

    const { error } = await supabase.from('assets').insert(payload);

    setIsLoading(false);
    if (error) {
      console.error("Erreur d'enregistrement:", error);
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess("Équipement enregistré !");
      form.reset();
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <FormLabel className="text-blue-700 font-bold mb-2 block">Photo</FormLabel>
          <ImageUpload onUpload={(url) => form.setValue("imageUrl", url)} />
        </div>

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Nom de l'appareil *</FormLabel><FormControl><Input placeholder="Ex: Échographe" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem><FormLabel>Catégorie *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Imagerie">Imagerie</SelectItem><SelectItem value="Laboratoire">Laboratoire</SelectItem><SelectItem value="Bloc">Bloc</SelectItem><SelectItem value="Autre">Autre</SelectItem></SelectContent></Select></FormItem>
          )} />
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem><FormLabel>Site *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir" /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="brand" render={({ field }) => (
            <FormItem><FormLabel>Marque</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="model" render={({ field }) => (
            <FormItem><FormLabel>Modèle</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="serialNumber" render={({ field }) => (
            <FormItem><FormLabel>N° Série</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="assignedTo" render={({ field }) => (
            <FormItem><FormLabel>Responsable</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || "none"}><FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">-- Aucun --</SelectItem>{techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></FormItem>
          )} />
        </div>

        <Button type="submit" className="w-full bg-blue-600 h-12 rounded-xl font-bold" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Enregistrer l'Équipement"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateAssetForm;