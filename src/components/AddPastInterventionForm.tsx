"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
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
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const InterventionSchema = z.object({
  title: z.string().min(5, "Le titre est requis."),
  description: z.string().min(10, "Veuillez décrire l'action menée."),
  maintenanceType: z.enum(["Preventive", "Corrective", "Palliative", "Ameliorative"]),
  date: z.string().min(1, "La date est requise."),
  partsReplaced: z.boolean().default(false),
});

type InterventionFormValues = z.infer<typeof InterventionSchema>;

interface AddPastInterventionFormProps {
  assetId: string;
  onSuccess: () => void;
}

const AddPastInterventionForm: React.FC<AddPastInterventionFormProps> = ({ assetId, onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { user } = useAuth();

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
      title: "",
      description: "",
      maintenanceType: "Corrective",
      date: format(new Date(), "yyyy-MM-dd"),
      partsReplaced: false,
    },
  });

  const onSubmit = async (data: InterventionFormValues) => {
    if (!user) return;
    setIsLoading(true);

    const { error } = await supabase.from('work_orders').insert({
      user_id: user.id,
      asset_id: assetId,
      title: data.title,
      description: data.description,
      maintenance_type: data.maintenanceType,
      due_date: data.date,
      status: 'Completed',
      parts_replaced: data.partsReplaced,
      priority: 'Medium'
    });

    setIsLoading(false);

    if (error) {
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess("Intervention enregistrée dans l'historique !");
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objet de l'intervention</FormLabel>
              <FormControl><Input placeholder="Ex: Remplacement des joints d'étanchéité" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de l'action</FormLabel>
                <FormControl><Input type="date" {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    <SelectItem value="Ameliorative">Améliorative</SelectItem>
                  </SelectContent>
                </Select>
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
              <FormLabel>Détails des travaux effectués</FormLabel>
              <FormControl><Textarea {...field} className="rounded-xl resize-none h-24" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center space-x-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
           <input 
             type="checkbox" 
             id="parts" 
             {...form.register("partsReplaced")} 
             className="h-4 w-4 text-blue-600 rounded"
           />
           <label htmlFor="parts" className="text-sm font-medium text-amber-800">Des pièces de rechange ont été utilisées</label>
        </div>

        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 rounded-xl mt-4" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 className="mr-2" size={18} />}
          Enregistrer dans l'historique
        </Button>
      </form>
    </Form>
  );
};

export default AddPastInterventionForm;