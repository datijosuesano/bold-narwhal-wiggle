import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ContractSchema = z.object({
  name: z.string().min(5, "Le nom du contrat est requis"),
  provider: z.string().min(2, "Le prestataire est requis"),
  clinic: z.string().min(2, "La clinique est requise"),
  startDate: z.date(),
  endDate: z.date(),
  annualCost: z.preprocess((a) => (a === "" ? 0 : parseFloat(z.string().parse(a))), z.number().positive()),
  description: z.string().optional(),
});

type ContractFormValues = z.infer<typeof ContractSchema>;

interface CreateContractFormProps {
  onSuccess: () => void;
}

const CreateContractForm: React.FC<CreateContractFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { user } = useAuth();

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(ContractSchema),
    defaultValues: { name: "", provider: "", clinic: "", description: "" },
  });

  const onSubmit = async (data: ContractFormValues) => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await supabase.from('contracts').insert({
      user_id: user.id,
      name: data.name,
      provider: data.provider,
      clinic: data.clinic,
      start_date: format(data.startDate, 'yyyy-MM-dd'),
      end_date: format(data.endDate, 'yyyy-MM-dd'),
      annual_cost: data.annualCost,
      description: data.description,
      status: 'Active'
    });
    setIsLoading(false);
    if (!error) {
      showSuccess("Contrat créé !");
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du Contrat</FormLabel>
              <FormControl><Input placeholder="Nom..." {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prestataire</FormLabel>
                <FormControl><Input placeholder="Prestataire" {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clinic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clinique</FormLabel>
                <FormControl><Input placeholder="Clinique" {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Début</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl><Button variant="outline" className="rounded-xl">{field.value ? format(field.value, "PPP") : "Choisir"}</Button></FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fin</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl><Button variant="outline" className="rounded-xl">{field.value ? format(field.value, "PPP") : "Choisir"}</Button></FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="annualCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coût Annuel (€)</FormLabel>
              <FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl><Textarea className="rounded-xl" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-blue-600 rounded-xl" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Créer le Contrat"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateContractForm;