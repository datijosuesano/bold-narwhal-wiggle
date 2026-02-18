import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, ClipboardList } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WORK_ORDER_PRIORITY, MAINTENANCE_TYPES } from "@/utils/constants";

const WorkOrderSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères."),
  description: z.string().min(10, "La description doit être détaillée (10 car. min)."),
  maintenanceType: z.enum(MAINTENANCE_TYPES),
  priority: z.enum(WORK_ORDER_PRIORITY),
  assetId: z.string().min(1, "Veuillez sélectionner un équipement."),
  dueDate: z.date({ required_error: "La date d'échéance est requise." }),
});

type WorkOrderFormValues = z.infer<typeof WorkOrderSchema>;

interface CreateWorkOrderFormProps {
  onSuccess: () => void;
}

const CreateWorkOrderForm: React.FC<CreateWorkOrderFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [assets, setAssets] = useState<{id: string, name: string}[]>([]);
  const [isAssetsLoading, setIsAssetsLoading] = useState(true);
  const { user } = useAuth();

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(WorkOrderSchema),
    defaultValues: {
      title: "",
      description: "",
      maintenanceType: "Préventive",
      priority: "Moyenne",
      assetId: "",
    },
  });

  useEffect(() => {
    const fetchAssets = async () => {
      setIsAssetsLoading(true);
      const { data } = await supabase.from('assets').select('id, name').order('name');
      setAssets(data || []);
      setIsAssetsLoading(false);
    };
    fetchAssets();
  }, []);

  const onSubmit = async (data: WorkOrderFormValues) => {
    if (!user) return;
    setIsLoading(true);
    
    const { error } = await supabase.from('work_orders').insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
      maintenance_type: data.maintenanceType,
      priority: data.priority,
      asset_id: data.assetId,
      due_date: format(data.dueDate, 'yyyy-MM-dd'),
      status: 'Ouvert',
    });
    
    setIsLoading(false);
    
    if (!error) {
      showSuccess("Ordre de travail créé avec succès !");
      onSuccess();
    } else {
      showError(`Erreur : ${error.message}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objet de la demande</FormLabel>
              <FormControl><Input placeholder="Ex : Révision annuelle autoclave" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="maintenanceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de Maintenance</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Niveau de Priorité</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {WORK_ORDER_PRIORITY.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="assetId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Équipement concerné</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={isAssetsLoading ? "Chargement..." : "Sélectionner un appareil"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date d'échéance souhaitée</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className="rounded-xl flex justify-between font-normal">
                      {field.value ? format(field.value, "dd MMMM yyyy", { locale: fr }) : "Choisir une date"}
                      <CalendarIcon size={16} className="opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={fr} />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description détaillée du problème ou de l'action</FormLabel>
              <FormControl><Textarea placeholder="Précisez les symptômes ou les points de contrôle..." className="resize-none rounded-xl h-24" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="sticky bottom-0 bg-background pt-2 pb-1">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg h-12 font-bold" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <ClipboardList className="mr-2 h-4 w-4" />}
            Émettre l'Ordre de Travail
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateWorkOrderForm;