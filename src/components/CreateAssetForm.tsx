import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, User, Tag, Factory } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ImageUpload from "./ImageUpload";

const AssetSchema = z.object({
  name: z.string().min(3, "Le nom est requis (3 car. min)"),
  description: z.string().optional(),
  serialNumber: z.string().min(1, "Le numéro de série est requis"),
  model: z.string().min(1, "Le modèle est requis"),
  brand: z.string().min(1, "La marque est requise"),
  manufacturer: z.string().min(1, "Le fabricant est requis"),
  location: z.string().min(1, "Veuillez sélectionner un site"),
  category: z.string().min(1, "La catégorie est requise"),
  assignedTo: z.string().optional().nullable(),
  imageUrl: z.string().optional(),
  commissioningDate: z.date({
    required_error: "La date de mise en service est requise",
  }),
  purchaseCost: z.preprocess(
    (a) => (a === "" ? 0 : parseFloat(z.string().parse(a))),
    z.number().min(0, "Le coût doit être positif")
  ),
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
    if (!user) {
      showError("Vous devez être connecté pour ajouter un équipement.");
      return;
    }
    
    setIsLoading(true);

    // Gestion du user_id pour éviter les erreurs de format UUID en mode démo
    const userId = user.id.includes('fake') ? null : user.id;

    const { error } = await supabase
      .from('assets')
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description || "",
        serial_number: data.serialNumber,
        model: data.model,
        brand: data.brand,
        manufacturer: data.manufacturer,
        location: data.location,
        commissioning_date: format(data.commissioningDate, 'yyyy-MM-dd'),
        purchase_cost: data.purchaseCost,
        category: data.category,
        image_url: data.imageUrl || null,
        assigned_to: data.assignedTo === "none" ? null : data.assignedTo,
        status: 'Opérationnel'
      });

    setIsLoading(false);
    
    if (error) {
      console.error("Erreur d'insertion:", error);
      showError(`Erreur base de données: ${error.message}`);
    } else {
      showSuccess("L'équipement a été enregistré avec succès !");
      form.reset();
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
          <FormLabel className="text-blue-700 font-bold mb-2 block">Photo de l'équipement</FormLabel>
          <ImageUpload onUpload={(url) => form.setValue("imageUrl", url)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l'appareil</FormLabel>
              <FormControl><Input placeholder="Ex: Échographe" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Imagerie">Imagerie</SelectItem>
                  <SelectItem value="Laboratoire">Laboratoire</SelectItem>
                  <SelectItem value="Bloc Opératoire">Bloc Opératoire</SelectItem>
                  <SelectItem value="Dentaire">Dentaire</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel>Site / Clinique</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir" /></SelectTrigger></FormControl>
                <SelectContent>
                  {clients.length > 0 ? clients.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  )) : <SelectItem value="none" disabled>Aucun site trouvé</SelectItem>}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="assignedTo" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><User size={14} className="mr-1" /> Responsable</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Non assigné" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="none">-- Aucun --</SelectItem>
                  {techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="brand" render={({ field }) => (
            <FormItem><FormLabel>Marque</FormLabel><FormControl><Input placeholder="Ex: GE" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="model" render={({ field }) => (
            <FormItem><FormLabel>Modèle</FormLabel><FormControl><Input placeholder="Ex: Voluson" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="manufacturer" render={({ field }) => (
            <FormItem><FormLabel>Fabricant</FormLabel><FormControl><Input placeholder="Ex: GE Healthcare" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="serialNumber" render={({ field }) => (
            <FormItem><FormLabel>N° Série</FormLabel><FormControl><Input placeholder="Ex: SN-9988" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Notes / Description</FormLabel><FormControl><Textarea placeholder="Détails optionnels..." {...field} className="rounded-xl h-20" /></FormControl></FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="commissioningDate" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Mise en service</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-xl flex justify-between font-normal">
                    {field.value ? format(field.value, "dd/MM/yyyy", { locale: fr }) : "Choisir"}
                    <CalendarIcon size={16} className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={field.value} 
                    onSelect={field.onChange}
                    captionLayout="dropdown"
                    fromYear={1990}
                    toYear={new Date().getFullYear() + 5}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="purchaseCost" render={({ field }) => (
            <FormItem><FormLabel>Coût (FCFA)</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="sticky bottom-0 bg-background pt-4 pb-2">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg h-12 text-lg font-bold" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Enregistrer l'Équipement"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateAssetForm;