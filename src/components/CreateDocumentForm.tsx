"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UploadCloud, Link as LinkIcon, FileText } from "lucide-react";

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
  name: z.string().min(3, "Le nom est requis"),
  category: z.string().min(1, "La catégorie est requise"),
  asset_id: z.string().min(1, "Veuillez sélectionner un équipement"),
  file_url: z.string().optional(),
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
  const { user } = useAuth();

  const form = useForm<DocFormValues>({
    resolver: zodResolver(DocSchema),
    defaultValues: {
      name: "",
      category: "Manuel Technique",
      asset_id: "",
      file_url: "",
    },
  });

  useEffect(() => {
    const fetchAssets = async () => {
      const { data } = await supabase.from('assets').select('id, name, location').order('name');
      setAssets(data || []);
    };
    fetchAssets();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !form.getValues('asset_id')) {
      if (!form.getValues('asset_id')) showError("Sélectionnez d'abord un équipement.");
      return;
    }

    setIsLoading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${form.getValues('asset_id')}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("asset-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("asset-documents").getPublicUrl(fileName);
      
      const { error: dbError } = await supabase.from('asset_documents').insert({
        asset_id: form.getValues('asset_id'),
        user_id: user?.id,
        name: form.getValues('name') || file.name,
        file_url: urlData.publicUrl,
        category: form.getValues('category')
      });

      if (dbError) throw dbError;
      showSuccess("Document PDF ajouté !");
      onSuccess();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLink = async (data: DocFormValues) => {
    if (!externalUrl) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('asset_documents').insert({
        asset_id: data.asset_id,
        user_id: user?.id,
        name: data.name,
        file_url: externalUrl,
        category: data.category
      });
      if (error) throw error;
      showSuccess("Lien web ajouté !");
      onSuccess();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleAddLink)} className="space-y-4">
        <FormField control={form.control} name="asset_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Équipement lié</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir un appareil" /></SelectTrigger></FormControl>
              <SelectContent>
                {assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.location})</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Titre du document</FormLabel><FormControl><Input placeholder="Ex: Schéma de câblage" {...field} className="rounded-xl" /></FormControl></FormItem>
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
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl h-12">
            <TabsTrigger value="upload" className="rounded-lg"><UploadCloud size={16} className="mr-2" /> Fichier PDF</TabsTrigger>
            <TabsTrigger value="link" className="rounded-lg"><LinkIcon size={16} className="mr-2" /> Lien URL</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === 'upload' ? (
          <div className="pt-2">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-400 transition-all">
              <div className="text-center">
                {isLoading ? <Loader2 className="animate-spin text-blue-600 mx-auto" /> : <FileText className="text-slate-400 mx-auto mb-2" />}
                <p className="text-xs font-bold text-slate-600">Cliquez pour envoyer un PDF</p>
              </div>
              <input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} disabled={isLoading} />
            </label>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <FormLabel>Lien URL (Google Drive, Dropbox, Site constructeur...)</FormLabel>
              <Input placeholder="https://..." value={externalUrl} onChange={e => setExternalUrl(e.target.value)} className="rounded-xl" />
            </div>
            <Button type="submit" className="w-full bg-blue-600 rounded-xl h-11" disabled={isLoading || !externalUrl}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <LinkIcon size={16} className="mr-2" />}
              Enregistrer le lien
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};

export default CreateDocumentForm;