"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, Factory, Package, Info, MapPin } from "lucide-react";
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
  FormDescription,
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

// Définition du schéma de validation
const AssetSchema = z.object({
  name: z.string().min(3, "Le nom est requis (3 car. min)"),
  description: z.string().optional().default(""),
  serialNumber: z.string().min(1, "Le numéro de série est requis"),
  model: z.string().min(1, "Le modèle est requis"),
  brand: z.string().min(1, "La marque est requise"),
  manufacturer: z.string().min(1, "Le fabricant est requis"),
  location: z.string().min(1, "Veuillez sélectionner un site client"),
  category: z.string().min(1, "La catégorie est requise"),
  status: z.string().min(1, "Le statut est requis"),
  assignedTo: z.string().optional().nullable().default("none"),
  imageUrl: z.string().optional().default(""),
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

  // Chargement des données externes (clients et techniciens)
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

    try {
      const { error } = await supabase.from('assets').insert({
        user_id: user.id.includes('fake') ? null : user.id,
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

      if (error) throw error;

      showSuccess(`Équipement "${data.name}" enregistré avec succès !`);
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Erreur insertion asset:", error);
      showError(`Erreur : ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[85vh] overflow-y-auto pr-3 custom-scrollbar">
        {/* Section Image */}
        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
          <FormLabel className="text-slate-900 font-black uppercase text-[10px] tracking-widest mb-4 block">Documentation Visuelle</FormLabel>
          <ImageUpload 
            onUpload={(url) => form.setValue("imageUrl", url)} 
            defaultValue={form.getValues("imageUrl")}
          />
          <FormDescription className="mt-2 text-[10px]">Importez une photo réelle de l'appareil pour faciliter son identification.</FormDescription>
        </div>

        {/* Informations Générales */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Info size={18} />
            <h3 className="font-bold text-sm uppercase">Identification</h3>
          </div>
          
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Désignation de l'équipement</FormLabel>
              <FormControl><Input placeholder="Ex : Scanner CT, Autoclave 50L..." {...field} className="rounded-xl h-11" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="brand" render={({ field }) => (
              <FormItem><FormLabel>Marque</FormLabel><FormControl><Input placeholder="Ex : GE, Philips, Siemens..." {...field} className="rounded-xl h-11" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="model" render={({ field }) => (
              <FormItem><FormLabel>Modèle</FormLabel><FormControl><Input placeholder="Ex : Somatom, Optima..." {...field} className="rounded-xl h-11" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="serialNumber" render={({ field }) => (
              <FormItem><FormLabel>Numéro de Série (S/N)</FormLabel><FormControl><Input placeholder="Requis pour la traçabilité" {...field} className="rounded-xl h-11 font-mono uppercase" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="manufacturer" render={({ field }) => (
              <FormItem><FormLabel>Fabricant / Constructeur</FormLabel><FormControl><Input placeholder="Nom de l'entreprise" {...field} className="rounded-xl h-11" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        </div>

        {/* Localisation et Statut */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-blue-600">
            <MapPin size={18} />
            <h3 className="font-bold text-sm uppercase">Logistique & État</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem>
                <FormLabel>Site / Établissement affecté</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Choisir un site" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie de matériel</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {ASSET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem>
                <FormLabel>Statut Opérationnel</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {ASSET_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="assignedTo" render={({ field }) => (
              <FormItem>
                <FormLabel>Responsable Technique</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "none"}>
                  <FormControl><SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Non assigné" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">-- Aucun --</SelectItem>
                    {techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>
        </div>

        {/* Dates et Coûts */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-blue-600">
            <Package size={18} />
            <h3 className="font-bold text-sm uppercase">Acquisition</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="commissioningDate" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Mise en service</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-xl h-11 flex justify-between font-normal border-slate-200">
                      {field.value ? format(field.value, "dd MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
                      <CalendarIcon size={16} className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={fr} /></PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="purchaseCost" render={({ field }) => (
              <FormItem><FormLabel>Valeur d'acquisition (FCFA)</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl h-11 font-bold text-blue-700" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        </div>

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Notes additionnelles</FormLabel>
            <FormControl><Textarea placeholder="Précisez ici les particularités techniques..." {...field} className="rounded-xl min-h-[100px] resize-none" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="sticky bottom-0 bg-white pt-4 pb-2">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xl h-14 text-lg font-black uppercase tracking-tight" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Factory className="mr-2 h-5 w-5" />}
            Intégrer à l'Inventaire
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateAssetForm;