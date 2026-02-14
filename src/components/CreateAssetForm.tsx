import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, User } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import ImageUpload from "./ImageUpload";

const AssetSchema = z.object({
  name: z.string().min(3, "Le nom est requis."),
  description: z.string().min(5, "La description est trop courte."),
  serialNumber: z.string().min(1, "Le numéro de série est requis."),
  model: z.string().min(1, "Le modèle est requis."),
  brand: z.string().min(1, "La marque est requise."),
  manufacturer: z.string().min(1, "Le fabricant est requis."),
  location: z.string().min(1, "Veuillez sélectionner un site."),
  category: z.string().min(1, "La catégorie est requise."),
  imageUrl: z.string().optional(),
  assignedTo: z.string().optional(),
  manufacturingDate: z.date({
    required_error: "La date de fabrication est requise.",
  }),
  commissioningDate: z.date({
    required_error: "La date de mise en service est requise.",
  }),
  expiryDate: z.date().optional().nullable(),
  purchaseCost: z.preprocess(
    (a) => (a === "" ? 0 : parseFloat(z.string().parse(a))),
    z.number().min(0, { message: "Le coût doit être positif." })
  ),
});

type AssetFormValues = z.infer<typeof AssetSchema>;

interface CreateAssetFormProps {
  onSuccess: () => void;
}

const CreateAssetForm: React.FC<CreateAssetFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [techs, setTechs] = useState<{id: string, first_name: string, last_name: string}[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
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
      category: "Médical",
      imageUrl: "",
      assignedTo: "none",
      purchaseCost: 0,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      const { data: clientsData } = await supabase.from('clients').select('id, name').order('name');
      const { data: techsData } = await supabase.from('profil').select('id, first_name, last_name').order('last_name');
      setClients(clientsData || []);
      setTechs(techsData || []);
      setIsDataLoading(false);
    };
    fetchData();
  }, []);

  const onSubmit = async (data: AssetFormValues) => {
    if (!user) return;
    setIsLoading(true);

    const { error } = await supabase
      .from('assets')
      .insert({
        user_id: user.id,
        name: data.name,
        description: data.description,
        serial_number: data.serialNumber,
        model: data.model,
        brand: data.brand,
        manufacturer: data.manufacturer,
        location: data.location,
        manufacturing_date: format(data.manufacturingDate, 'yyyy-MM-dd'),
        commissioning_date: format(data.commissioningDate, 'yyyy-MM-dd'),
        expiry_date: data.expiryDate ? format(data.expiryDate, 'yyyy-MM-dd') : null,
        purchase_cost: data.purchaseCost,
        category: data.category,
        image_url: data.imageUrl,
        assigned_to: data.assignedTo === "none" ? null : data.assignedTo,
        status: 'Opérationnel'
      });

    setIsLoading(false);

    if (error) {
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess("Équipement ajouté et assigné !");
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
        <FormItem>
          <FormLabel>Photo de l'équipement</FormLabel>
          <ImageUpload onUpload={(url) => form.setValue("imageUrl", url)} />
        </FormItem>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l'équipement</FormLabel>
              <FormControl><Input placeholder="Ex: IRM Siemens" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="p-4 bg-muted/30 rounded-xl border-2 border-dashed">
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><User size={14} className="mr-2 text-blue-600" /> Affecter à un technicien</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choisir un responsable" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">-- Aucun (Stock général) --</SelectItem>
                    {techs.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={isDataLoading ? "Chargement..." : "Choisir"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <FormControl><Textarea {...field} className="rounded-xl resize-none h-24" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="manufacturingDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de fabrication</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className="rounded-xl flex justify-between font-normal">
                        {field.value ? format(field.value, "dd/MM/yyyy") : "Choisir"}
                        <CalendarIcon size={16} className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
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
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="sticky bottom-0 bg-background pt-2 pb-1">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Ajouter l'Équipement"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateAssetForm;