"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UploadCloud, CheckCircle2, AlertTriangle } from "lucide-react";

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
  name: z.string().min(3, "Titre requis"),
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
    if (!user) return showError("Reconnectez-vous.");
    setIsLoading(true);
    
    try {
      let finalUrl = "";

      if (mode === 'upload' && selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `assets/${data.asset_id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("asset-documents").upload(fileName, selectedFile);
        if (uploadError) throw new Error("Erreur lors du transfert du fichier.");
        const { data: urlData } = supabase.storage.from("asset-documents").getPublicUrl(fileName);
        finalUrl = urlData.publicUrl;
      } else {
        finalUrl = externalUrl;
      }

      // ON ENVOIE LES DEUX ICI : asset_id pour le lien, user_id pour la sécurité
      const { error: dbError } = await supabase.from('asset_documents').insert({
        asset_id: data.asset_id, // LIEN VERS L'APPAREIL
        user_id: user.id,        // LIEN VERS L'AUTEUR (RLS)
        name: data.name,
        file_url: finalUrl,
        category: data.category
      });

      if (dbError) throw dbError;

      showSuccess("Document enregistré !");
      onSuccess();
    } catch (err: any) {
      showError(err.message || "Erreur lors de l'enregistrement.");
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
                  <SelectValue placeholder="Sélectionner l'équipement" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.location})</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Titre du document</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Manuel Technique">Manuel Technique</SelectItem>
                  <SelectItem value="Schéma">Schéma / Plan</SelectItem>
                  <SelectItem value="Certificat">Certificat</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <Tabs value={mode} onValueChange={(v: any) => setMode(v)}>
          <TabsList className="grid w-full grid-cols-2 rounded-xl h-11 bg-slate-100">
            <TabsTrigger value="upload" className="rounded-lg">Fichier local</TabsTrigger>
            <TabsTrigger value="link" className="rounded-lg">Lien URL</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === 'upload' ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-blue-50">
            {selectedFile ? <span className="text-blue-600 font-bold">{selectedFile.name}</span> : <span className="text-xs text-slate-500">Choisir un PDF</span>}
            <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
          </label>
        ) : (
          <Input placeholder="https://..." value={externalUrl} onChange={e => setExternalUrl(e.target.value)} className="rounded-xl" />
        )}

        <Button type="submit" className="w-full bg-blue-600 h-12 rounded-xl font-bold" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Enregistrer"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateDocumentForm;