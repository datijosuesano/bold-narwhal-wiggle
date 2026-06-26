"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Printer, Save, FileText, LayoutTemplate } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useReactToPrint } from "react-to-print";

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
  reportNumber: z.string().min(1, "Le numéro est requis"),
  type: z.enum(["Intervention", "Mission"]),
  title: z.string().min(3, "Titre trop court"),
  client: z.string().optional(),
  technician: z.string().optional(),
  content: z.string().min(5, "Le contenu est requis"),
  date: z.string(),
});

type ReportFormValues = z.infer<typeof ReportSchema>;

interface CreateReportFormProps {
  onSuccess: () => void;
  initialData?: any;
}

const CreateReportForm: React.FC<CreateReportFormProps> = ({ onSuccess, initialData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(ReportSchema),
    defaultValues: {
      reportNumber: `RPT-${format(new Date(), 'yyyyMMdd-HHmm')}`,
      type: "Intervention",
      title: initialData?.title || "",
      client: initialData?.assets?.location || initialData?.intervention_place || "",
      technician: initialData?.technician_name || "",
      content: initialData?.description || "",
      date: initialData?.due_date || initialData?.intervention_date || new Date().toISOString().split('T')[0],
    },
  });

  const formValues = form.watch(); 

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${formValues.reportNumber}_${formValues.title}`,
    onAfterPrint: () => {
      onSuccess(); 
    },
    pageStyle: `
      @page { size: A4 portrait; margin: 15mm; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    `,
  });

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
      showSuccess("Rapport généré et sauvegardé !");
      setTimeout(() => {
        handlePrint();
      }, 150);
    } else {
      showError(`Erreur lors de la sauvegarde: ${error.message}`);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto px-1 custom-scrollbar">
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner grid grid-cols-2 gap-4">
            <FormField control={form.control} name="reportNumber" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center text-blue-700"><FileText size={14} className="mr-1" /> Numéro du rapport</FormLabel>
                <FormControl><Input {...field} className="rounded-xl font-mono font-bold bg-white" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Type de rapport</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="rounded-xl bg-white"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Intervention">Intervention Technique</SelectItem>
                    <SelectItem value="Mission">Rapport de Mission</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Objet / Titre de l'intervention</FormLabel>
              <FormControl><Input {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="content" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><LayoutTemplate size={14} className="mr-1" /> Corps du rapport / Observations</FormLabel>
              <FormControl><Textarea className="rounded-xl min-h-[150px] resize-none" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-12 mt-4" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            {isLoading ? "Enregistrement..." : "Enregistrer & Imprimer le Rapport"}
          </Button>
        </form>
      </Form>

      {/* GABARIT DE RENDU CORRIGÉ ICI AVEC LES CLASSES PRINT NATIVES DE TAILWIND */}
      <div className="hidden print:block">
        <div ref={printRef} className="bg-white p-10 w-full text-black font-sans">
          
          {/* EN-TÊTE PDF */}
          <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-black">
                Rapport {formValues.type === 'Intervention' ? "d'Intervention" : "de Mission"}
              </h1>
              <h2 className="text-lg font-bold text-gray-600 mt-1">Service Ingénierie Biomédicale</h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-blue-600 mb-1">BIOPULSE GMAO</div>
              <div className="text-sm font-bold bg-gray-100 px-3 py-1 rounded inline-block border border-gray-300">
                Rapport N° : {formValues.reportNumber}
              </div>
            </div>
          </div>

          {/* SECTION 1 : INFORMATIONS */}
          <div className="mb-8">
            <h3 className="text-sm font-black uppercase text-gray-500 border-b border-gray-300 pb-1 mb-3">1. Informations Générales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] uppercase text-gray-500 font-bold">RIT Rattaché</p>
                <p className="font-mono font-bold text-sm">{initialData?.rit_number || "Non spécifié"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-500 font-bold">Date de rédaction</p>
                <p className="font-bold text-sm">{format(new Date(formValues.date || new Date()), 'dd MMMM yyyy', { locale: fr })}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-500 font-bold">Lieu / Client</p>
                <p className="font-bold text-sm">{formValues.client || "---"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-gray-500 font-bold">Équipement</p>
                <p className="font-bold text-sm">{initialData?.assets?.name || "Non applicable"}</p>
              </div>
            </div>
          </div>

          {/* SECTION 2 : CONTENU DU RAPPORT */}
          <div className="mb-8">
            <h3 className="text-sm font-black uppercase text-gray-500 border-b border-gray-300 pb-1 mb-3">2. Description détaillée</h3>
            <div className="mb-4">
              <p className="text-[11px] uppercase text-gray-500 font-bold mb-1">Objet</p>
              <p className="font-bold text-sm bg-gray-100 p-3 rounded">{formValues.title || "---"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-gray-500 font-bold mb-1">Corps du rapport</p>
              <p className="text-sm text-justify whitespace-pre-wrap leading-relaxed border border-gray-200 p-4 rounded min-h-[150px]">
                {formValues.content || "Aucun contenu."}
              </p>
            </div>
          </div>

          {/* SIGNATURES */}
          <div className="mt-16 grid grid-cols-2 gap-8">
            <div className="border-t border-black pt-2">
              <p className="text-xs font-black uppercase text-center">Le Technicien / Rédacteur</p>
              <p className="text-[10px] text-gray-500 text-center mt-1">(Nom, Date et Signature)</p>
              <p className="font-bold text-center mt-4 text-sm">{formValues.technician || user?.email}</p>
              <div className="h-20"></div>
            </div>
            <div className="border-t border-black pt-2">
              <p className="text-xs font-black uppercase text-center">Visa Responsable / Client</p>
              <p className="text-[10px] text-gray-500 text-center mt-1">(Cachet et Signature pour validation)</p>
              <div className="h-20"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateReportForm;