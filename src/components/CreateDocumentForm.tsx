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
  name: z.string().min(3, "Le nom doit comporter au moins 3 caractères"),
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();

  const form = useForm<DocFormValues>({
    resolver: zodResolver(DocSchema),
    defaultValues: {
      name: "",
      category: "Manuel Technique",
      asset_id: "",
    },
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
      // On pré-remplit le nom si vide
      if (!form.getValues('name')) {
        form.setValue('name', file.name.split('.')[0]);
      }
    }
  };

  const onSubmit = async (data: DocFormValues) => {
    if (!user) {
      showError("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    setIsLoading(true);
    let finalUrl = externalUrl;

    try {
      // Cas 1 : Mode Upload (Fichier)
      if (mode === 'upload') {
        if (!selectedFile) {
          throw new Error("Veuillez sélectionner un fichier PDF ou Image.");
        }

        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${data.asset_id}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("asset-documents")
          .upload(fileName, selectedFile);

        if (uploadError) {
          if (uploadError.message.includes("not found")) {
            throw new Error("Le dossier 'asset-documents' n'existe pas dans Supabase Storage.");
          }
          throw uploadError;
        }

        const { data: urlData } = supabase.storage.from("asset-documents").getPublicUrl(fileName);
        finalUrl = urlData.publicUrl;
      }

      // Cas 2 : On enregistre dans la base de données
      if (!finalUrl) throw new Error("URL manquante pour le document.");

      const { error: dbError } = await supabase.from('asset_documents').insert({
        asset_id: data.asset_id,
        user_id: user.id,
        name: data.name,
        file_url: finalUrl,
        category: data.category
      });

      if (dbError) throw dbError;

      showSuccess("Document enregistré avec succès !");
      onSuccess();
    } catch (err: any) {
      console.error("Erreur enregistrement:", err);
      showError(err.message || "Une erreur est survenue lors de l'enregistrement.");
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
          <TabsList className="grid w-full grid-cols-2 rounded-xl h-12">
            <TabsTrigger value="upload" className="rounded-lg"><UploadCloud size={16} className="mr-2" /> Fichier Local</TabsTrigger>
            <TabsTrigger value="link" className="rounded-lg"><LinkIcon size={16} className="mr-2" /> Lien Web</TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === 'upload' ? (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-400 transition-all group">
              <div className="text-center">
                {selectedFile ? (
                  <div className="flex flex-col items-center text-blue-600">
                    <CheckCircle2 className="h-8 w-8 mb-2" />
                    <p className="text-xs font-bold truncate max-w-[200px]">{selectedFile.name}</p>
                  </div>
                ) : (
                  <>
                    <FileText className="text-slate-400 mx-auto mb-2 group-hover:text-blue-500" />
                    <p className="text-xs font-bold text-slate-600">Cliquez pour choisir un PDF ou Image</p>
                  </>
                )}
              </div>
              <input type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileChange} />
            </label>
          </div>
        ) : (
          <div className="space-y-1.5">
            <FormLabel>URL (Lien vers Google Drive, Dropbox, etc.)</FormLabel>
            <Input 
              placeholder="https://..." 
              value={externalUrl} 
              onChange={e => setExternalUrl(e.target.value)} 
              className="rounded-xl" 
            />
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12 shadow-lg font-bold" 
          disabled={isLoading || (mode === 'link' && !externalUrl) || (mode === 'upload' && !selectedFile)}
        >
          {isLoading ? (
            <><Loader2 className="animate-spin mr-2" /> Enregistrement...</>
          ) : (
            <>Enregistrer le document</>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default CreateDocumentForm;