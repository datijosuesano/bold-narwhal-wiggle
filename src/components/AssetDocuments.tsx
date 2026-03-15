"use client";

import React, { useState, useEffect } from "react";
import { FileText, UploadCloud, Trash2, Download, Loader2, Link as LinkIcon, FileType, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AssetDocument {
  id: string;
  name: string;
  file_url: string;
  category: string;
  created_at: string;
}

interface AssetDocumentsProps {
  assetId: string;
}

const AssetDocuments: React.FC<AssetDocumentsProps> = ({ assetId }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("Manuel Technique");
  const [externalUrl, setExternalUrl] = useState("");
  const [mode, setMode] = useState<'upload' | 'link'>('upload');

  const fetchDocuments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('asset_documents')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false });

    if (!error) setDocuments(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchDocuments(); }, [assetId]);

  const handleAddLink = async () => {
    if (!docName.trim() || !externalUrl.trim()) {
      showError("Veuillez remplir le nom et le lien URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('asset_documents').insert({
        asset_id: assetId,
        user_id: user?.id,
        name: docName,
        file_url: externalUrl,
        category: docCategory,
      });

      if (error) throw error;
      showSuccess("Lien ajouté avec succès !");
      setDocName("");
      setExternalUrl("");
      fetchDocuments();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      if (!docName.trim()) {
        showError("Donnez un nom au document avant l'envoi.");
        return;
      }

      setIsSubmitting(true);
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${assetId}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("asset-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("asset-documents").getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('asset_documents').insert({
        asset_id: assetId,
        user_id: user?.id,
        name: docName,
        file_url: urlData.publicUrl,
        category: docCategory
      });

      if (dbError) throw dbError;

      showSuccess("Fichier importé !");
      setDocName("");
      fetchDocuments();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    try {
      if (url.includes('supabase.co/storage')) {
        const path = url.split('asset-documents/')[1];
        if (path) await supabase.storage.from('asset-documents').remove([path]);
      }
      await supabase.from('asset_documents').delete().eq('id', id);
      showSuccess("Supprimé.");
      fetchDocuments();
    } catch (err) {
      showError("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed bg-muted/10 border-blue-100 rounded-2xl overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
            <Button 
              size="sm" 
              variant={mode === 'upload' ? 'default' : 'ghost'} 
              className="rounded-lg text-xs"
              onClick={() => setMode('upload')}
            >
              <UploadCloud size={14} className="mr-2" /> Fichier PDF
            </Button>
            <Button 
              size="sm" 
              variant={mode === 'link' ? 'default' : 'ghost'} 
              className="rounded-lg text-xs"
              onClick={() => setMode('link')}
            >
              <LinkIcon size={14} className="mr-2" /> Lien URL
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Type de Document</label>
              <Select value={docCategory} onValueChange={setDocCategory}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manuel Technique">Manuel Technique</SelectItem>
                  <SelectItem value="Manuel Utilisateur">Manuel Utilisateur</SelectItem>
                  <SelectItem value="Schéma Electrique">Schéma Electrique</SelectItem>
                  <SelectItem value="Certificat / PV">Certificat / PV</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nom personnalisé</label>
              <Input 
                placeholder="Ex: Manuel Entretien V2" 
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
          </div>

          {mode === 'link' ? (
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Lien vers le document (URL)</label>
                <Input 
                  placeholder="https://..." 
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
              <Button 
                onClick={handleAddLink} 
                disabled={isSubmitting || !docName || !externalUrl}
                className="bg-blue-600 rounded-xl h-11 px-6 shadow-lg"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Ajouter"}
              </Button>
            </div>
          ) : (
            <div>
              <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-2xl cursor-pointer bg-white border-blue-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                <div className="flex flex-col items-center justify-center text-center">
                  {isSubmitting ? <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" /> : <UploadCloud className="h-8 w-8 text-blue-600 mb-2" />}
                  <p className="text-sm font-bold text-slate-700">
                    {isSubmitting ? "Envoi en cours..." : "Cliquez pour uploader le fichier"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">PDF, JPG, PNG acceptés</p>
                </div>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isSubmitting || !docName} />
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
        ) : documents.length > 0 ? (
          documents.map((doc) => {
            const isExternal = !doc.file_url.includes('supabase.co/storage');
            return (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-card border rounded-2xl hover:shadow-md transition-all border-l-4 border-l-blue-500">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    {isExternal ? <Globe size={20} /> : <FileType size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      {doc.name}
                      <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0">
                        {doc.category}
                      </Badge>
                    </h4>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">
                      Ajouté le {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full text-blue-600 hover:bg-blue-50"
                    asChild
                  >
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Download size={18} />
                    </a>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(doc.id, doc.file_url)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-3xl bg-slate-50">
            <FileText className="mx-auto h-10 w-10 text-slate-200 mb-2" />
            <p className="text-xs font-medium text-slate-400">Aucun document pour cet équipement.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetDocuments;