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
  title: z.string().min(5, "Titre trop court"),
  client: z.string().min(1, "Client requis"),
  technician: z.string().min(1, "Technicien requis"),
  content: z.string().min(10, "Contenu requis"),
  date: z.string(),
});

type ReportFormValues = z.infer<typeof ReportSchema>;

interface CreateReportFormProps {
  onSuccess: () => void;
  initialData?: any;
}

const CreateReportForm: React.FC<CreateReportFormProps> = ({ onSuccess, initialData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const { user } = useAuth();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportSchema),
    defaultValues: {
      type: "Intervention",
      title: initialData?.title || "",
      client: initialData?.assets?.location || "",
      technician: initialData?.technician_name || "",
      content: initialData?.description || "",
      date: initialData?.due_date || new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('id, name').order('name');
      setClients(data || []);
    };
    fetchClients();
  }, []);

  const onSubmit = async (data: ReportFormValues) => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await supabase.from('reports').insert({
      user_id: user.id,
      title: data.title,
      type: data.type,
      content: data.content,
      date: data.date,
      status: 'Brouillon'
    });
    setIsLoading(false);
    if (!error) {
      showSuccess("Rapport généré !");
      onSuccess();
    } else {
      showError(`Erreur: ${error.message}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Objet du rapport</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="content" render={({ field }) => (
          <FormItem><FormLabel>Corps du rapport</FormLabel><FormControl><Textarea className="rounded-xl min-h-[150px]" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full bg-blue-600 rounded-xl" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : <><FileCheck className="mr-2 h-4 w-4" /> Finaliser</>}
        </Button>
      </form>
    </Form>
  );
};

export default CreateReportForm;