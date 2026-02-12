"use client";

import React from "react";
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
  client: z.string().min(2, "Client requis"),
  technician: z.string().min(1, "Technicien requis"),
  content: z.string().min(20, "Contenu requis"),
  date: z.string(),
});

type ReportFormValues = z.infer<typeof ReportSchema>;

interface CreateReportFormProps {
  onSuccess: () => void;
}

const CreateReportForm: React.FC<CreateReportFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = React.useState(false);
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

  const onSubmit = async (data: ReportFormValues) => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await supabase.from('reports').insert({
      user_id: user.id,
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
      showSuccess("Rapport enregistré !");
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
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
              <FormLabel>Client / Site</FormLabel>
              <FormControl><Input placeholder="Site..." {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objet</FormLabel>
              <FormControl><Input placeholder="Objet..." {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="technician"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Technicien</FormLabel>
              <FormControl><Input placeholder="Nom..." {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compte-rendu</FormLabel>
              <FormControl><Textarea className="rounded-xl min-h-[120px]" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-blue-600 rounded-xl" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Générer le Rapport"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateReportForm;