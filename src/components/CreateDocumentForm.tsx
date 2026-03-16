"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UploadCloud, Link as LinkIcon, FileText, CheckCircle2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DocSchema = z.object({
  name: z.string().min(3, "Titre requis (3 car. min)"),
  category: z.string().min(1, "Catégorie requise"),
  asset_id: z.string().min(1, "Équipement requis"),
});

type DocFormValues = z.infer<typeof DocSchema>;

interface CreateDocumentFormProps {
  onSuccess: () => void;
}

const CreateDocumentForm: React.FC<CreateDocumentFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [assets, setAssets] = useState<{id: string, name: string, location: string}[]>([]);
  const [externalUrl, setExternalUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAssets = async () => {
      const { data } = await supabase.from('assets').select('id, name, location').order('name');
      setAssets(data || []);
    };
    fetchAssets();
  }, []);

  const form = useForm<DocFormValues>({
    resolver: zodResolver(DocSchema),
    defaultValues: { name: "", category: "Manuel Technique", asset_id: "" },
  });

  const onSubmit = async (data: DocFormValues) => {
    if (!user) {
      showError("Session non trouvée. Reconnectez-vous.");
      return;
    }

    setIsLoading(true);
    console.log("Tentative d'enregistrement...", { mode, data });

    try {
      let finalUrl = "";

      if (mode === 'upload') {
        if (!selectedFile) throw new Error("Fichier manquant.");
        
        const fileName = `${Date.now()}-${selectedFile.name.replace(/\s/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from("asset-documents")
          .upload(fileName, selectedFile);

        if (uploadError) throw new Error(`Erreur Stockage : ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from("asset-documents").getPublicUrl(fileName);
        finalUrl = urlData.publicUrl;
      } else {
        if (!externalUrl) throw new Error("URL du lien manquante.");
        finalUrl = externalUrl;
      }

      // Insertion finale
      const { error: dbError } = await supabase.from('asset_documents').insert({
        asset_id: data.asset_id,
        user_id: user.id,
        name: data.name,
        file_url: finalUrl,
        category: data.category
      });

      if (dbError) throw new Error(`Erreur Base de données : ${dbError.message}`);

      showSuccess("Enregistrement réussi !");
      onSuccess();
    } catch (err: any) {
      console.error("Crash formulaire:", err);
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="asset_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Équipement lié</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Choisir un appareil" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.location})</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Titre du document</FormLabel>
              <FormControl><Input placeholder="Ex: Plan d'entretien" {...field} className="rounded-xl" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Manuel Technique">Manuel Technique</SelectItem>
                  <SelectItem value="Manuel Utilisateur">Manuel Utilisateur</SelectItem>
                  <SelectItem value="Schéma">Schéma / Plan</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl h-12 bg-slate-100">
            <TabsTrigger value="upload" className="rounded-lg">Fichier PDF</TabsTrigger>
            <TabsTrigger value="link" className="rounded-lg">Lien Web</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === 'upload' ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-blue-50 border-slate-200 transition-all">
            <div className="text-center">
              {selectedFile ? (
                <div className="text-blue-600 font-bold text-xs">
                  <CheckCircle2 className="mx-auto mb-2" />
                  {selectedFile.name}
                </div>
              ) : (
                <>
                  <FileText className="text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Sélectionner un fichier</p>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept="application/pdf,image/*" onChange={(e) => {
              if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
            }} />
          </label>
        ) : (
          <Input 
            placeholder="https://..." 
            value={externalUrl} 
            onChange={e => setExternalUrl(e.target.value)} 
            className="rounded-xl" 
          />
        )}

        <Button type="submit" className="w-full bg-blue-600 h-12 rounded-xl font-bold" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Confirmer l'enregistrement"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateDocumentForm;