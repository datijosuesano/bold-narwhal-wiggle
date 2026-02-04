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
  name: z.string().min(5, "Le nom du contrat doit contenir au moins 5 caractères"),
  provider: z.string().min(2, "Le nom du prestataire est requis"),
  clinic: z.string().min(2, "Le nom de la clinique est requis"),
  startDate: z.date({
    required_error: "La date de début est requise",
  }),
  endDate: z.date({
    required_error: "La date de fin est requise",
  }),
  annualCost: z.preprocess(
    (a) => (a === "" ? undefined : parseFloat(z.string().parse(a))),
    z.number().positive("Le coût doit être un nombre positif")
  ),
  description: z.string().optional(),
});

type ContractFormValues = z.infer<typeof ContractSchema>;

interface CreateContractFormProps {
  onSuccess: () => void;
}

const CreateContractForm: React.FC<CreateContractFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(ContractSchema),
    defaultValues: {
      name: "",
      provider: "",
      clinic: "",
      description: "",
    },
  });

  const onSubmit = (data: ContractFormValues) => {
    setIsLoading(true);
    console.log("Nouveau contrat soumis:", data);

    // Simulation d'appel API
    setTimeout(() => {
      setIsLoading(false);
      showSuccess(`Le contrat "${data.name}" a été créé avec succès !`);
      form.reset();
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
              <FormControl>
                <Input placeholder="Ex: Maintenance IRM Bloc A" {...field} className="rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prestataire / Fournisseur</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: GE Healthcare" {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clinic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clinique concernée</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Clinique de l'Espoir" {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de début</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal rounded-xl",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Choisir une date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de fin / Échéance</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal rounded-xl",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Choisir une date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < form.getValues("startDate")}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
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
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} className="rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes additionnelles (Optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Détails sur les clauses, contact d'urgence..."
                  className="resize-none rounded-xl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Créer le Contrat"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default CreateContractForm;