import React, { useEffect, useState } from "react";
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

const ContractSchema = z.object({
  name: z.string().min(5, "Le nom du contrat est requis"),
  provider: z.string().min(2, "Le prestataire est requis"),
  clinic: z.string().min(1, "Veuillez sélectionner une clinique"),
  startDate: z.date({
    required_error: "La date de début est requise",
  }),
  endDate: z.date({
    required_error: "La date de fin est requise",
  }),
  annualCost: z.preprocess((a) => (a === "" ? 0 : parseFloat(z.string().parse(a))), z.number().positive("Le coût doit être un nombre positif")),
  description: z.string().optional(),
});

type ContractFormValues = z.infer<typeof ContractSchema>;

interface CreateContractFormProps {
  onSuccess: () => void;
}

const CreateContractForm: React.FC<CreateContractFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [isClientsLoading, setIsClientsLoading] = useState(true);
  const { user } = useAuth();

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(ContractSchema),
    defaultValues: { 
      name: "", 
      provider: "", 
      clinic: "", 
      description: "",
      annualCost: 0
    },
  });

  // Récupération de la liste des clients
  useEffect(() => {
    const fetchClients = async () => {
      setIsClientsLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      
      if (!error) {
        setClients(data || []);
      }
      setIsClientsLoading(false);
    };
    fetchClients();
  }, []);

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
    
    if (error) {
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess("Contrat créé avec succès !");
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
              <FormControl><Input placeholder="Ex: Maintenance Préventive 2024" {...field} className="rounded-xl" /></FormControl>
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
                <FormLabel>Prestataire</FormLabel>
                <FormControl><Input placeholder="Nom de la société" {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clinic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clinique / Site</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={isClientsLoading ? "Chargement..." : "Choisir un site"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.name}>
                          {client.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">Aucun site trouvé</div>
                    )}
                  </SelectContent>
                </Select>
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
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Choisir</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
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
                <FormLabel>Date de fin</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("pl-3 text-left font-normal rounded-xl", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Choisir</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
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
              <FormControl><Input type="number" placeholder="0.00" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes additionnelles</FormLabel>
              <FormControl><Textarea placeholder="Détails du contrat..." className="rounded-xl resize-none" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl mt-4" disabled={isLoading || isClientsLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
          {isLoading ? "Création en cours..." : "Créer le Contrat"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateContractForm;