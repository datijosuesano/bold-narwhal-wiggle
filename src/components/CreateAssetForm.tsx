"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, Factory } from "lucide-react";
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
  name: z.string().min(3, "Le nom est requis"),
  description: z.string().optional().default(""),
  serial_number: z.string().min(1, "Le numéro de série est requis"),
  model: z.string().min(1, "Le modèle est requis"),
  brand: z.string().min(1, "La marque est requise"),
  manufacturer: z.string().min(1, "Le fabricant est requis"),
  location: z.string().min(1, "Veuillez sélectionner un site"),
  category: z.string().min(1, "La catégorie est requise"),
  status: z.string().min(1, "Le statut est requis"),
  assigned_to: z.string().optional().nullable().default("none"),
  image_url: z.string().optional().default(""),
  commissioning_date: z.date({ required_error: "La date de mise en service est requise" }),
  manufacturing_date: z.date().optional().nullable(),
  expiry_date: z.date().optional().nullable(),
  purchase_cost: z.coerce.number().min(0, "Le coût doit être positif"),
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
      serial_number: "",
      model: "",
      brand: "",
      manufacturer: "",
      location: "",
      category: "autre",
      status: "Opérationnel",
      assigned_to: "none",
      image_url: "",
      commissioning_date: new Date(),
      manufacturing_date: null,
      expiry_date: null,
      purchase_cost: 0,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientData } = await supabase.from('clients').select('id, name').order('name');
      setClients(clientData || []);
      const { data: techData } = await supabase.from('profiles').select('id, first_name, last_name');
      setTechs(techData?.map(t => ({ id: t.id, name: `${t.first_name} ${t.last_name}` })) || []);
    };
    fetchData();
  }, []);

  const onSubmit = async (data: AssetFormValues) => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { error } = await supabase.from('assets').insert({
        user_id: user.id,
        name: data.name,
        description: data.description,
        serial_number: data.serial_number,
        model: data.model,
        brand: data.brand,
        manufacturer: data.manufacturer,
        location: data.location,
        category: data.category,
        status: data.status,
        commissioning_date: format(data.commissioning_date, 'yyyy-MM-dd'),
        manufacturing_date: data.manufacturing_date ? format(data.manufacturing_date, 'yyyy-MM-dd') : null,
        expiry_date: data.expiry_date ? format(data.expiry_date, 'yyyy-MM-dd') : null,
        purchase_cost: data.purchase_cost,
        image_url: data.image_url || null,
        assigned_to: data.assigned_to === "none" ? null : data.assigned_to,
      });

      if (error) throw error;
      showSuccess(`Équipement "${data.name}" enregistré.`);
      onSuccess();
    } catch (error: any) {
      showError(`Erreur : ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[85vh] overflow-y-auto pr-3 custom-scrollbar">
        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
          <ImageUpload onUpload={(url) => form.setValue("image_url", url)} />
        </div>

        <div className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Désignation</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
          
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description / Remarques</FormLabel>
              <FormControl><Textarea {...field} className="rounded-xl resize-none h-20" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="brand" render={({ field }) => (
              <FormItem><FormLabel>Marque</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="model" render={({ field }) => (
              <FormItem><FormLabel>Modèle</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
            )} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="serial_number" render={({ field }) => (
              <FormItem><FormLabel>N° de Série</FormLabel><FormControl><Input {...field} className="rounded-xl font-mono uppercase" /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="manufacturer" render={({ field }) => (
              <FormItem><FormLabel>Fabricant</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
            )} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel>Site</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir un site" /></SelectTrigger></FormControl>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {ASSET_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{ASSET_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="assigned_to" render={({ field }) => (
            <FormItem>
              <FormLabel>Responsable</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "none"}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Non assigné" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="none">-- Aucun --</SelectItem>
                  {techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <FormField control={form.control} name="manufacturing_date" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fabrication</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className="rounded-xl flex justify-between font-normal px-2">
                      {field.value ? format(field.value, "dd/MM/yy") : "Date"}
                      <CalendarIcon size={14} className="opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={field.value || undefined} 
                    onSelect={field.onChange} 
                    locale={fr} 
                    captionLayout="dropdown" 
                    fromYear={1980} 
                    toYear={2050}
                  />
                </PopoverContent>
              </Popover>
            </FormItem>
          )} />
          <FormField control={form.control} name="commissioning_date" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Mise en service</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className="rounded-xl flex justify-between font-normal px-2">
                      {field.value ? format(field.value, "dd/MM/yy") : "Date"}
                      <CalendarIcon size={14} className="opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={field.value} 
                    onSelect={field.onChange} 
                    locale={fr} 
                    captionLayout="dropdown" 
                    fromYear={1980} 
                    toYear={2050}
                  />
                </PopoverContent>
              </Popover>
            </FormItem>
          )} />
          <FormField control={form.control} name="expiry_date" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Péremption / Expire</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className="rounded-xl flex justify-between font-normal px-2">
                      {field.value ? format(field.value, "dd/MM/yy") : "Date"}
                      <CalendarIcon size={14} className="opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={field.value || undefined} 
                    onSelect={field.onChange} 
                    locale={fr} 
                    captionLayout="dropdown" 
                    fromYear={1980} 
                    toYear={2060}
                  />
                </PopoverContent>
              </Popover>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="purchase_cost" render={({ field }) => (
          <FormItem><FormLabel>Coût d'achat (FCFA)</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl font-bold" /></FormControl></FormItem>
        )} />

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xl h-14 text-lg font-black uppercase" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Factory className="mr-2 h-5 w-5" />}
          Enregistrer l'équipement
        </Button>
      </form>
    </Form>
  );
};

export default CreateAssetForm;