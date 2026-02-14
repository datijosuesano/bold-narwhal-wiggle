"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, FileCheck } from "lucide-react";

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

const ReportSchema = z.object({
  type: z.enum(["Intervention", "Mission"]),
  title: z.string().min(5, "Titre trop court (5 car. min)"),
  client: z.string().min(1, "Veuillez sélectionner un client"),
  technician: z.string().min(1, "Technicien requis"),
  content: z.string().min(10, "Contenu requis"),
  date: z.string(),
});

type ReportFormValues = z.infer<typeof ReportSchema>;

interface CreateReportFormProps {
  onSuccess: () => void;
}

const CreateReportForm: React.FC<CreateReportFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [isClientsLoading, setIsClientsLoading] = useState(true);
  const { user } = useAuth();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportSchema),
    defaultValues: {
      type: "Intervention",
      title: "",
      client: "",
      technician: "",
      content: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const fetchClients = async () => {
      setIsClientsLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error("Error fetching clients:", error);
      } else {
        setClients(data || []);
      }
      setIsClientsLoading(false);
    };

    fetchClients();
  }, []);

  const onSubmit = async (data: ReportFormValues) => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await supabase.from('reports').insert({
      user_id: user.id.includes('fake') ? null : user.id,
      title: data.title,
      type: data.type,
      client: data.client,
      technician: data.technician,
      content: data.content,
      date: data.date,
      status: 'Draft'
    });
    setIsLoading(false);
    if (!error) {
      showSuccess("Rapport enregistré avec succès !");
      onSuccess();
    } else {
      showError("Erreur lors de l'enregistrement du rapport");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de Document</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Intervention">Intervention</SelectItem>
                    <SelectItem value="Mission">Mission</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl><Input type="date" {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="client"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client / Site concerné</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={isClientsLoading ? "Chargement des clients..." : "Sélectionner un client"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.name}>
                      {client.name}
                    </SelectItem>
                  ))}
                  {clients.length === 0 && !isClientsLoading && (
                    <SelectItem value="none" disabled>Aucun client trouvé</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objet de la mission</FormLabel>
              <FormControl><Input placeholder="Ex: Maintenance annuelle scanner..." {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="technician"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intervenant</FormLabel>
              <FormControl><Input placeholder="Nom du technicien..." {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compte-rendu détaillé</FormLabel>
              <FormControl><Textarea placeholder="Actions réalisées, constatations..." className="rounded-xl min-h-[150px] resize-none" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="sticky bottom-0 bg-background pt-2 pb-1">
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg" disabled={isLoading || isClientsLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : <><FileCheck className="mr-2 h-4 w-4" /> Générer le Rapport</>}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateReportForm;