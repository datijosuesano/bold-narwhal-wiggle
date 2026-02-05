"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Calendar, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { showSuccess } from "@/utils/toast";

const InteractionSchema = z.object({
  type: z.string().min(1, "Le type est requis"),
  content: z.string().min(10, "Veuillez détailler l'échange (10 car. min)"),
  shouldSchedule: z.boolean().default(false),
  scheduleDate: z.string().optional(),
});

type InteractionFormValues = z.infer<typeof InteractionSchema>;

interface CreateInteractionFormProps {
  onSuccess: () => void;
  clientName: string;
}

const CreateInteractionForm: React.FC<CreateInteractionFormProps> = ({ onSuccess, clientName }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<InteractionFormValues>({
    resolver: zodResolver(InteractionSchema),
    defaultValues: {
      type: "Appel Sortant",
      content: "",
      shouldSchedule: false,
    },
  });

  const watchSchedule = form.watch("shouldSchedule");

  const onSubmit = (data: InteractionFormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showSuccess(`Échange avec ${clientName} enregistré !`);
      if (data.shouldSchedule) {
        showSuccess(`Rappel programmé pour le ${data.scheduleDate}.`);
      }
      form.reset();
      onSuccess();
    }, 1200);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type d'échange</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Appel, Visite, Email..." {...field} className="rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Résumé de la conversation</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Points clés abordés..." 
                  className="rounded-xl min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/30">
          <div className="space-y-0.5">
            <FormLabel className="text-base font-bold flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-blue-600" />
              Programmer une suite ?
            </FormLabel>
            <FormDescription>
              Ajoute un rappel automatique dans le planning.
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={form.watch("shouldSchedule")}
              onCheckedChange={(checked) => form.setValue("shouldSchedule", checked)}
            />
          </FormControl>
        </div>

        {watchSchedule && (
          <FormField
            control={form.control}
            name="scheduleDate"
            render={({ field }) => (
              <FormItem className="animate-in slide-in-from-top-2 duration-300">
                <FormLabel>Date de rappel / intervention</FormLabel>
                <FormControl>
                  <Input type="date" {...field} className="rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl mt-4" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <MessageSquare className="mr-2" size={18} />}
          Enregistrer l'échange
        </Button>
      </form>
    </Form>
  );
};

export default CreateInteractionForm;