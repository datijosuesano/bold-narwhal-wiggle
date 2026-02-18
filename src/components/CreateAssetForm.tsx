import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, User, Factory } from "lucide-react";
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
import { ASSET_CATEGORIES, ASSET_STATUS } from "@/utils/constants";

const AssetSchema = z.object({
  name: z.string().min(3, "Le nom est requis (3 car. min)"),
  description: z.string().optional(),
  serialNumber: z.string().min(1, "Le numéro de série est requis"),
  model: z.string().min(1, "Le modèle est requis"),
  brand: z.string().min(1, "La marque est requise"),
  manufacturer: z.string().min(1, "Le fabricant est requis"),
  location: z.string().min(1, "Veuillez sélectionner un site client"),
  category: z.enum(ASSET_CATEGORIES),
  status: z.enum(ASSET_STATUS),
  assignedTo: z.string().optional().nullable(),
  imageUrl: z.string().optional(),
  commissioningDate: z.date({ required_error: "La date de mise en service est requise" }),
  purchaseCost: z.coerce.number().min(0, "Le coût doit être positif"),
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
      description: "",
      serialNumber: "",
      model: "",
      brand: "",
      manufacturer: "",
      location: "",
      category: "Imagerie",
      status: "Opérationnel",
      assignedTo: "none",
      imageUrl: "",
      commissioningDate: new Date(),
      purchaseCost: 0,
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
    if (!user) return;
    setIsLoading(true);

    const { error } = await supabase.from('assets').insert({
      user_id: user.id,
      name: data.name,
      description: data.description,
      serial_number: data.serialNumber,
      model: data.model,
      brand: data.brand,
      manufacturer: data.manufacturer,
      location: data.location,
      category: data.category,
      status: data.status,
      commissioning_date: format(data.commissioningDate, 'yyyy-MM-dd'),
      purchase_cost: data.purchaseCost,
      image_url: data.imageUrl || null,
      assigned_to: data.assignedTo === "none" ? null : data.assignedTo,
    });

    setIsLoading(false);
    
    if (!error) {
      showSuccess("Équipement enregistré avec succès !");
      onSuccess();
    } else {
      showError(`Erreur : ${error.message}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
          <FormLabel className="text-blue-700 font-bold mb-2 block">Photo de l'appareil</FormLabel>
          <ImageUpload onUpload={(url) => form.setValue("imageUrl", url)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Désignation de l'équipement</FormLabel><FormControl><Input placeholder="Ex : Scanner CT" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie Biomédicale</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {ASSET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel>Site / Établissement</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir un site" /></SelectTrigger></FormControl>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>État Initial</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {ASSET_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="brand" render={({ field }) => (
            <FormItem><FormLabel>Marque</FormLabel><FormControl><Input placeholder="Ex : Siemens" {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="model" render={({ field }) => (
            <FormItem><FormLabel>Modèle</FormLabel><FormControl><Input placeholder="Ex : Somatom" {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="serialNumber" render={({ field }) => (
            <FormItem><FormLabel>Numéro de Série (S/N)</FormLabel><FormControl><Input placeholder="Requis pour traçabilité" {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="purchaseCost" render={({ field }) => (
            <FormItem><FormLabel>Valeur d'acquisition (FCFA)</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="commissioningDate" render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Date de mise en service</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-xl flex justify-between font-normal">
                  {field.value ? format(field.value, "dd/MM/yyyy") : "Sélectionner"}
                  <CalendarIcon size={16} className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={fr} /></PopoverContent>
            </Popover>
          </FormItem>
        )} />

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg h-12 text-lg font-bold" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Factory className="mr-2" />}
          Intégrer à l'Inventaire
        </Button>
      </form>
    </Form>
  );
};

export default CreateAssetForm;