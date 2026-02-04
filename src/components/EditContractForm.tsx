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
import { showSuccess } from "@/utils/toast";

const ContractSchema = z.object({
  name: z.string().min(5, "Le nom du contrat est trop court"),
  provider: z.string().min(2, "Le prestataire est requis"),
  clinic: z.string().min(2, "La clinique est requise"),
  startDate: z.date(),
  endDate: z.date(),
  annualCost: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive()),
  description: z.string().optional(),
});

type ContractFormValues = z.infer<typeof ContractSchema>;

interface Contract {
  id: string;
  name: string;
  provider: string;
  clinic: string;
  startDate: Date;
  endDate: Date;
  status: 'Active' | 'ExpiringSoon' | 'Expired';
  annualCost: number;
}

interface EditContractFormProps {
  contract: Contract;
  onSuccess: () => void;
}

const EditContractForm: React.FC<EditContractFormProps> = ({ contract, onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(ContractSchema),
    defaultValues: {
      name: contract.name,
      provider: contract.provider,
      clinic: contract.clinic,
      startDate: contract.startDate,
      endDate: contract.endDate,
      annualCost: contract.annualCost,
      description: "",
    },
  });

  const onSubmit = (data: ContractFormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showSuccess("Contrat mis à jour avec succès !");
      onSuccess();
    }, 1500);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du Contrat</FormLabel>
              <FormControl><Input {...field} className="rounded-xl" /></FormControl>
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
                <FormControl><Input {...field} className="rounded-xl" /></FormControl>
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
                <FormControl><Input {...field} className="rounded-xl" /></FormControl>
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
                <FormLabel>Date de début</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("pl-3 text-left font-normal rounded-xl", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Choisir</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de fin</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("pl-3 text-left font-normal rounded-xl", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Choisir</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
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

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Sauvegarder les modifications"}
        </Button>
      </form>
    </Form>
  );
};

export default EditContractForm;