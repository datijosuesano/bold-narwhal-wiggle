import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, Building2 } from "lucide-react";
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
  manufacturingDate: z.date({
    required_error: "La date de fabrication est requise.",
  }),
  commissioningDate: z.date({
    required_error: "La date de mise en service est requise.",
  }),
  expiryDate: z.date().optional().nullable(),
  purchaseCost: z.preprocess(
    (a) => parseFloat(z.string().min(1).parse(a)),
    z.number().positive({ message: "Le coût doit être positif." })
  ),
});

type AssetFormValues = z.infer<typeof AssetSchema>;

interface CreateAssetFormProps {
  onSuccess: () => void;
}

const CreateAssetForm: React.FC<CreateAssetFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [isClientsLoading, setIsClientsLoading] = useState(true);
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
      manufacturingDate: undefined,
      commissioningDate: undefined,
      expiryDate: null,
      purchaseCost: 0,
    },
  });

  useEffect(() => {
    const fetchClients = async () => {
      setIsClientsLoading(true);
      const { data } = await supabase.from('clients').select('id, name');
      setClients(data || []);
      setIsClientsLoading(false);
    };
    fetchClients();
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
        status: 'Opérationnel'
      });

    setIsLoading(false);

    if (error) {
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess("Équipement ajouté !");
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marque</FormLabel>
                <FormControl><Input placeholder="Ex: Siemens" {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fabricant</FormLabel>
                <FormControl><Input placeholder="Ex: Siemens Healthineers" {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={isClientsLoading ? "Chargement..." : "Choisir"} />
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° Série</FormLabel>
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

        <div className="grid grid-cols-2 gap-4">
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
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
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
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pb-4">
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de péremption (Optionnel)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className="rounded-xl flex justify-between font-normal">
                        {field.value ? format(field.value, "dd/MM/yyyy") : "Aucune"}
                        <CalendarIcon size={16} className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} /></PopoverContent>
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

        <Button type="submit" className="w-full bg-blue-600 rounded-xl" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Ajouter l'Équipement"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateAssetForm;