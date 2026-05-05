"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ClipboardList, Calendar as CalendarIcon } from "lucide-react";
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
import { PRIORITES, TYPES_MAINTENANCE, STATUTS_WORK_ORDER } from "@/utils/constants";

const WorkOrderSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères."),
  description: z.string().min(10, "La description est obligatoire (10 car. min)."),
  maintenance_type: z.enum(TYPES_MAINTENANCE),
  priority: z.enum(PRIORITES),
  status: z.enum(STATUTS_WORK_ORDER),
  asset_id: z.string().min(1, "Veuillez sélectionner un équipement."),
  due_date: z.date({ required_error: "La date d'échéance est requise." }),
  assigned_to: z.string().optional().nullable(),
});

type WorkOrderFormValues = z.infer<typeof WorkOrderSchema>;

interface WorkOrderFormProps {
  initialData?: any;
  onSuccess: () => void;
}

const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ initialData, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [assets, setAssets] = useState<{id: string, name: string, serial_number: string, location: string}[]>([]);
  const [techs, setTechs] = useState<{id: string, name: string}[]>([]);
  const { user } = useAuth();

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(WorkOrderSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      maintenance_type: initialData?.maintenance_type || "Préventive",
      priority: initialData?.priority || "Moyenne",
      status: initialData?.status || "Ouvert",
      asset_id: initialData?.asset_id || "",
      due_date: initialData?.due_date ? new Date(initialData.due_date) : new Date(),
      assigned_to: initialData?.assigned_to || null,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: assetData } = await supabase
        .from('assets')
        .select('id, name, serial_number, location')
        .order('name');
      setAssets(assetData || []);
      
      const { data: techData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('last_name');
      setTechs(techData?.map(t => ({ id: t.id, name: `${t.first_name} ${t.last_name}` })) || []);
    };
    fetchData();
  }, []);

  const onSubmit = async (data: WorkOrderFormValues) => {
    if (!user) return;
    setIsLoading(true);
    
    const payload = {
      user_id: user.id,
      asset_id: data.asset_id,
      title: data.title,
      description: data.description,
      maintenance_type: data.maintenance_type,
      priority: data.priority,
      status: data.status,
      due_date: format(data.due_date, 'yyyy-MM-dd'),
      assigned_to: data.assigned_to === "none" ? null : data.assigned_to,
    };

    let error;
    if (initialData?.id) {
      const { error: updateError } = await supabase.from('work_orders').update(payload).eq('id', initialData.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('work_orders').insert(payload);
      error = insertError;
    }
    
    setIsLoading(false);
    
    if (!error) {
      showSuccess(initialData ? "Ordre de travail mis à jour !" : "Ordre de travail créé !");
      onSuccess();
    } else {
      showError(`Erreur : ${error.message}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objet de l'intervention</FormLabel>
              <FormControl><Input placeholder="Ex : Panne alimentation scanner" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priorité</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {PRIORITES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maintenance_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de Maintenance</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {TYPES_MAINTENANCE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="asset_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Équipement concerné</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!!initialData}>
                <FormControl>
                  <SelectTrigger className="rounded-xl h-auto py-2">
                    <SelectValue placeholder="Choisir un appareil" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assets.map(a => (
                    <SelectItem key={a.id} value={a.id} className="py-2">
                       <div className="flex flex-col">
                        <span className="font-bold text-xs">{a.name}</span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                          SN: {a.serial_number || 'N/A'} • {a.location}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut de l'OT</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {STATUTS_WORK_ORDER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Échéance</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className="rounded-xl flex justify-between font-normal">
                        {field.value ? format(field.value, "dd/MM/yyyy") : "Choisir"}
                        <CalendarIcon size={16} className="opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={fr} />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="assigned_to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assigner à (Technicien)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "none"}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir un technicien" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="none">-- Non assigné --</SelectItem>
                  {techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description détaillée</FormLabel>
              <FormControl><Textarea placeholder="Symptômes, pièces suspectées..." className="resize-none rounded-xl h-24" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12 font-bold shadow-lg" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <ClipboardList className="mr-2 h-4 w-4" />}
          {initialData ? "Mettre à jour l'OT" : "Créer l'Ordre de Travail"}
        </Button>
      </form>
    </Form>
  );
};

export default WorkOrderForm;