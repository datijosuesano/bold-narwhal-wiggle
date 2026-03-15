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

  const form = useForm<DocFormValues>({
    resolver: zodResolver(DocSchema),
    defaultValues: { name: "", category: "Manuel Technique", asset_id: "" },
  });

  useEffect(() => {
    const fetchAssets = async () => {
      const { data } = await supabase.from('assets').select('id, name, location').order('name');
      setAssets(data || []);
    };
    fetchAssets();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!form.getValues('name')) form.setValue('name', file.name.split('.')[0]);
    }
  };

  const onSubmit = async (data: DocFormValues) => {
    console.log("[CreateDoc] Début soumission", { mode, data });
    setIsLoading(true);

    try {
      let finalUrl = externalUrl;

      // ÉTAPE 1: GESTION DU FICHIER (si mode upload)
      if (mode === 'upload') {
        if (!selectedFile) throw new Error("Veuillez choisir un fichier.");
        
        console.log("[CreateDoc] Upload du fichier vers Storage...");
        const fileName = `${Date.now()}-${selectedFile.name.replace(/[^a-z0-9.]/gi, '_')}`;
        
        const { error: uploadError } = await supabase.storage
          .from("asset-documents")
          .upload(fileName, selectedFile);

        if (uploadError) {
          console.error("[CreateDoc] Erreur Storage:", uploadError);
          throw new Error(`Erreur Stockage: ${uploadError.message}. Vérifiez que le bucket 'asset-documents' existe.`);
        }

        const { data: urlData } = supabase.storage.from("asset-documents").getPublicUrl(fileName);
        finalUrl = urlData.publicUrl;
        console.log("[CreateDoc] Fichier uploadé avec succès:", finalUrl);
      }

      // ÉTAPE 2: INSERTION EN BASE DE DONNÉES
      if (!finalUrl) throw new Error("L'URL du document est manquante.");

      console.log("[CreateDoc] Insertion en base de données...");
      const { error: dbError } = await supabase.from('asset_documents').insert({
        asset_id: data.asset_id,
        user_id: user?.id,
        name: data.name,
        file_url: finalUrl,
        category: data.category
      });

      if (dbError) {
        console.error("[CreateDoc] Erreur DB:", dbError);
        throw dbError;
      }

      console.log("[CreateDoc] Succès total !");
      showSuccess("Le document a été enregistré.");
      onSuccess();
    } catch (err: any) {
      console.error("[CreateDoc] Erreur rattrapée:", err);
      showError(err.message || "Une erreur inconnue est survenue.");
    } finally {
      // On s'assure que le chargement s'arrête quoi qu'il arrive
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
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Titre du document</FormLabel>
              <FormControl><Input placeholder="Ex: Plan d'entretien" {...field} className="rounded-xl" /></FormControl>
              <FormMessage />
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
                  <SelectItem value="PV Intervention">PV Intervention</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl h-12 bg-slate-100">
            <TabsTrigger value="upload" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><UploadCloud size={16} className="mr-2" /> Fichier local</TabsTrigger>
            <TabsTrigger value="link" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"><LinkIcon size={16} className="mr-2" /> Lien Web</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === 'upload' ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-400 transition-all group">
            <div className="text-center">
              {selectedFile ? (
                <div className="flex flex-col items-center text-blue-600 animate-in fade-in zoom-in-95">
                  <CheckCircle2 className="h-8 w-8 mb-2" />
                  <p className="text-xs font-bold truncate max-w-[200px]">{selectedFile.name}</p>
                </div>
              ) : (
                <>
                  <FileText className="text-slate-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
                  <p className="text-xs font-bold text-slate-600">Cliquez pour choisir un PDF ou Image</p>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="space-y-1.5 animate-in slide-in-from-top-2">
            <FormLabel>Adresse URL du document</FormLabel>
            <Input 
              placeholder="https://google.com/mon-document.pdf" 
              value={externalUrl} 
              onChange={e => setExternalUrl(e.target.value)} 
              className="rounded-xl h-11" 
            />
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12 shadow-lg font-bold transition-all active:scale-[0.98]" 
          disabled={isLoading || (mode === 'link' && !externalUrl) || (mode === 'upload' && !selectedFile)}
        >
          {isLoading ? (
            <><Loader2 className="animate-spin mr-2" /> Enregistrement en cours...</>
          ) : (
            <>Enregistrer le document</>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default CreateDocumentForm;