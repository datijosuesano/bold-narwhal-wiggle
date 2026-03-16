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
import { Tabs, TabsList, TabsTrigger } from "@/tabs";
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
      try {
        const { data, error } = await supabase.from('assets').select('id, name, location').order('name');
        if (error) throw error;
        setAssets(data || []);
      } catch (err) {
        console.error("Erreur chargement équipements:", err);
      }
    };
    fetchAssets();
  }, []);

  const form = useForm<DocFormValues>({
    resolver: zodResolver(DocSchema),
    defaultValues: { name: "", category: "Manuel Technique", asset_id: "" },
  });

  const onSubmit = async (data: DocFormValues) => {
    if (!user) return showError("Session expirée. Reconnectez-vous.");
    setIsLoading(true);
    
    try {
      let finalUrl = "";

      if (mode === 'upload') {
        if (!selectedFile) throw new Error("Veuillez choisir un fichier.");
        
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${data.asset_id}/${Date.now()}.${fileExt}`;
        const filePath = `documentation/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("asset-documents")
          .upload(filePath, selectedFile);

        if (uploadError) {
          if (uploadError.message.includes("not found")) {
            throw new Error("Dossier 'asset-documents' non trouvé dans le Storage Supabase.");
          }
          throw uploadError;
        }

        const { data: urlData } = supabase.storage.from("asset-documents").getPublicUrl(filePath);
        finalUrl = urlData.publicUrl;
      } else {
        if (!externalUrl) throw new Error("Veuillez saisir une URL.");
        finalUrl = externalUrl;
      }

      const { error: dbError } = await supabase.from('asset_documents').insert({
        asset_id: data.asset_id,
        user_id: user.id,
        name: data.name,
        file_url: finalUrl,
        category: data.category
      });

      if (dbError) throw dbError;

      showSuccess("Document enregistré !");
      onSuccess();
    } catch (err: any) {
      console.error("Erreur doc:", err);
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
            <FormLabel>Associer à un équipement</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder={assets.length === 0 ? "Aucun équipement trouvé" : "Choisir l'équipement"} />
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
            <FormItem><FormLabel>Nom du document</FormLabel><FormControl><Input {...field} className="rounded-xl" /></FormControl></FormItem>
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

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <Button 
            type="button"
            variant={mode === 'upload' ? 'default' : 'ghost'} 
            className="flex-1 rounded-lg text-xs"
            onClick={() => setMode('upload')}
          >Fichier local</Button>
          <Button 
            type="button"
            variant={mode === 'link' ? 'default' : 'ghost'} 
            className="flex-1 rounded-lg text-xs"
            onClick={() => setMode('link')}
          >Lien URL</Button>
        </div>

        {mode === 'upload' ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-blue-50 transition-colors">
            {selectedFile ? (
              <span className="text-blue-600 font-bold text-sm">{selectedFile.name}</span>
            ) : (
              <div className="text-center">
                <UploadCloud className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <span className="text-xs text-slate-500">Cliquez pour choisir un PDF ou Image</span>
              </div>
            )}
            <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
          </label>
        ) : (
          <Input 
            placeholder="https://exemple.com/manuel.pdf" 
            value={externalUrl} 
            onChange={e => setExternalUrl(e.target.value)} 
            className="rounded-xl" 
          />
        )}

        <Button type="submit" className="w-full bg-blue-600 h-12 rounded-xl font-bold shadow-lg" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Enregistrer le document"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateDocumentForm;