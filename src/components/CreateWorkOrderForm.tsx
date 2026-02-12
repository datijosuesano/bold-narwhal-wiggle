import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const WorkOrderSchema = z.object({
  title: z.string().min(5, {
    message: "Le titre doit contenir au moins 5 caractères.",
  }),
  description: z.string().min(10, {
    message: "La description est trop courte.",
  }),
  maintenanceType: z.enum(["Preventive", "Corrective", "Palliative", "Ameliorative"], {
    required_error: "Le type de maintenance est requis.",
  }),
  priority: z.enum(["Low", "Medium", "High"], {
    required_error: "La priorité est requise.",
  }),
  assetId: z.string().min(1, {
    message: "Veuillez sélectionner un équipement.",
  }),
  dueDate: z.date({
    required_error: "La date d'échéance est requise.",
  }),
});

type WorkOrderFormValues = z.infer<typeof WorkOrderSchema>;

interface CreateWorkOrderFormProps {
  onSuccess: () => void;
}

interface Asset {
  id: string;
  name: string;
}

const CreateWorkOrderForm: React.FC<CreateWorkOrderFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [isAssetsLoading, setIsAssetsLoading] = React.useState(true);
  const { user } = useAuth();

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(WorkOrderSchema),
    defaultValues: {
      title: "",
      description: "",
      maintenanceType: "Preventive",
      priority: "Medium",
      assetId: "",
      dueDate: undefined,
    },
  });

  useEffect(() => {
    const fetchAssets = async () => {
      setIsAssetsLoading(true);
      const { data, error } = await supabase.from('assets').select('id, name');
      if (!error) setAssets(data as Asset[]);
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
      status: 'Open',
    });
    setIsLoading(false);
    if (!error) {
      showSuccess("OT créé !");
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre de l'OT</FormLabel>
              <FormControl><Input placeholder="Ex: Remplacement filtre" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea placeholder="Détails..." className="resize-none rounded-xl" {...field} /></FormControl>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Preventive">Préventive</SelectItem>
                    <SelectItem value="Corrective">Corrective</SelectItem>
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
                <FormLabel>Priorité</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Low">Basse</SelectItem>
                    <SelectItem value="Medium">Moyenne</SelectItem>
                    <SelectItem value="High">Haute</SelectItem>
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
              <FormLabel>Équipement</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir" /></SelectTrigger></FormControl>
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
              <FormLabel>Date d'échéance</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl><Button variant="outline" className="rounded-xl">{field.value ? format(field.value, "PPP") : "Choisir"}</Button></FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-blue-600 rounded-xl" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Créer l'Ordre de Travail"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateWorkOrderForm;