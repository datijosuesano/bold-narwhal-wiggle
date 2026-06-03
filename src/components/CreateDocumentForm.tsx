"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UploadCloud, FileCheck } from "lucide-react";

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
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { DOCUMENT_CATEGORIES } from "@/utils/constants";

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
    defaultValues: {
      name: "",
      category: "Manuel Technique",
      asset_id: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 1. Validation de la taille (Max 5 Mo)
      const maxSizeBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        showError("Le fichier est trop volumineux. La taille maximale autorisée est de 5 Mo.");
        return;
      }

      // 2. Validation stricte du type MIME
      const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(file.type)) {
        showError("Format de fichier non accepté. Veuillez sélectionner un PDF, JPEG, PNG ou WEBP.");
        return;
      }

      setSelectedFile(file);
    }
  };

  const detectMimeTypeForLink = (url: string): string => {
    const cleanUrl = url.toLowerCase().split('?')[0];
    if (cleanUrl.endsWith('.pdf')) return 'application/pdf';
    if (cleanUrl.endsWith('.png')) return 'image/png';
    if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) return 'image/jpeg';
    if (cleanUrl.endsWith('.webp')) return 'image/webp';
    return 'application/octet-stream'; // Valeur par défaut
  };

  const onSubmit = async (data: DocFormValues) => {
    if (!user) {
      showError("Session introuvable. Veuillez vous déconnecter et vous reconnecter.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      let finalUrl = "";
      let detectedMime = "";

      if (mode === 'upload') {
        if (!selectedFile) throw new Error("Veuillez d'abord sélectionner un fichier.");
        
        detectedMime = selectedFile.type;
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${data.asset_id}/${Date.now()}.${fileExt}`;
        const filePath = `documentation/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("asset-documents")
          .upload(filePath, selectedFile);

        if (uploadError) {
          throw new Error(`Erreur Storage: ${uploadError.message}.`);
        }

        const { data: urlData } = supabase.storage.from("asset-documents").getPublicUrl(filePath);
        finalUrl = urlData.publicUrl;
      } else {
        if (!externalUrl) throw new Error("Veuillez saisir une adresse URL valide.");
        finalUrl = externalUrl;
        detectedMime = detectMimeTypeForLink(externalUrl);
      }

      const { error: dbError } = await supabase.from('asset_documents').insert({
        asset_id: data.asset_id,
        user_id: user.id,
        name: data.name,
        file_url: finalUrl,
        category: data.category,
        mime_type: detectedMime // Enregistrement de la nouvelle colonne
      });

      if (dbError) {
        throw new Error(`Erreur Base de données: ${dbError.message}`);
      }

      showSuccess("Document enregistré avec succès !");
      form.reset();
      setSelectedFile(null);
      setExternalUrl("");
      onSuccess();
    } catch (err: any) {
      console.error("Détail de l'erreur:", err);
      showError(err.message || "Une erreur inconnue est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="asset_id" render={({ field }) => (
          <FormItem>
            <FormLabel>Équipement associé</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder={assets.length === 0 ? "Aucun équipement en base" : "Choisir l'équipement"} />
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
            <FormItem><FormLabel>Nom du document</FormLabel><FormControl><Input placeholder="ex: Manuel Utilisateur" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            type="button"
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
              mode === 'upload' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
            )}
            onClick={() => setMode('upload')}
          >Fichier local</button>
          <button 
            type="button"
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
              mode === 'link' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"
            )}
            onClick={() => setMode('link')}
          >Lien URL (ex: Drive)</button>
        </div>

        {mode === 'upload' ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-400 transition-all">
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <FileCheck className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-blue-600 font-bold text-sm">{selectedFile.name}</span>
                <span className="text-[10px] text-slate-400 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} Mo</span>
              </div>
            ) : (
              <div className="text-center">
                <UploadCloud className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <span className="text-xs text-slate-500">Sélectionner un PDF, JPG, PNG ou WEBP</span>
                <span className="block text-[10px] text-slate-400 mt-1">Limite maximale : 5 Mo</span>
              </div>
            )}
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="space-y-2">
            <FormLabel className="text-xs">Lien vers le document</FormLabel>
            <Input 
              placeholder="https://votre-drive.com/fichier.pdf" 
              value={externalUrl} 
              onChange={e => setExternalUrl(e.target.value)} 
              className="rounded-xl h-11" 
            />
          </div>
        )}

        <Button type="submit" className="w-full bg-blue-600 h-12 rounded-xl font-bold shadow-lg" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <FileCheck className="mr-2 h-4 w-4" />}
          Enregistrer le document
        </Button>
      </form>
    </Form>
  );
};

export default CreateDocumentForm;