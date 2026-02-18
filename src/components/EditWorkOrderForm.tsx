"use client";

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

const WorkOrderSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères."),
  description: z.string().min(10, "La description est trop courte."),
  maintenanceType: z.enum(["Preventive", "Corrective", "Palliative", "Ameliorative"]),
  priority: z.enum(["Low", "Medium", "High"]),
  status: z.enum(["Open", "InProgress", "Completed", "Cancelled"]),
  assetId: z.string().min(1, "Veuillez sélectionner un équipement."),
  dueDate: z.date(),
});

type WorkOrderFormValues = z.infer<typeof WorkOrderSchema>;

interface EditWorkOrderFormProps {
  workOrder: any;
  onSuccess: () => void;
}

const EditWorkOrderForm: React.FC<EditWorkOrderFormProps> = ({ workOrder, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [assets, setAssets] = useState<{id: string, name: string}[]>([]);

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(WorkOrderSchema),
    defaultValues: {
      title: workOrder.title,
      description: workOrder.description,
      maintenanceType: workOrder.maintenance_type,
      priority: workOrder.priority,
      status: workOrder.status,
      assetId: workOrder.asset_id,
      dueDate: new Date(workOrder.due_date),
    },
  });

  useEffect(() => {
    const fetchAssets = async () => {
      const { data } = await supabase.from('assets').select('id, name').order('name');
      setAssets(data || []);
    };
    fetchAssets();
  }, []);

  const onSubmit = async (data: WorkOrderFormValues) => {
    setIsLoading(true);
    
    const { error } = await supabase
      .from('work_orders')
      .update({
        title: data.title,
        description: data.description,
        maintenance_type: data.maintenanceType,
        priority: data.priority,
        status: data.status,
        asset_id: data.assetId,
        due_date: format(data.dueDate, 'yyyy-MM-dd'),
      })
      .eq('id', workOrder.id);
    
    setIsLoading(false);
    
    if (!error) {
      showSuccess("Ordre de travail mis à jour !");
      onSuccess();
    } else {
      showError(`Erreur: ${error.message}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl><Input {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Open">Ouvert</SelectItem>
                    <SelectItem value="InProgress">En cours</SelectItem>
                    <SelectItem value="Completed">Terminé</SelectItem>
                    <SelectItem value="Cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priorité</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Low">Basse</SelectItem>
                    <SelectItem value="Medium">Moyenne</SelectItem>
                    <SelectItem value="High">Haute</SelectItem>
                  </SelectContent>
                </Select>
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
              <FormControl><Textarea className="rounded-xl h-24" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="maintenanceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Preventive">Préventive</SelectItem>
                    <SelectItem value="Corrective">Corrective</SelectItem>
                    <SelectItem value="Palliative">Palliative</SelectItem>
                    <SelectItem value="Ameliorative">Améliorative</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
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
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full bg-blue-600 rounded-xl h-12 font-bold" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
          Enregistrer les modifications
        </Button>
      </form>
    </Form>
  );
};

export default EditWorkOrderForm;