"use client";

import React, { useState, useEffect } from "react";
import { FileText, UploadCloud, Trash2, Download, Loader2, Plus, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

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
  const [isUploading, setIsUploading] = useState(false);
  const [docName, setDocName] = useState("");

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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      if (!docName.trim()) {
        showError("Veuillez donner un nom au document avant l'envoi.");
        return;
      }

      setIsUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${assetId}/${fileName}`;

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
        category: 'Technique'
      });

      if (dbError) throw dbError;

      showSuccess("Document ajouté !");
      setDocName("");
      fetchDocuments();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    try {
      const fileName = url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('asset-documents').remove([`${assetId}/${fileName}`]);
      }
      await supabase.from('asset_documents').delete().eq('id', id);
      showSuccess("Document supprimé.");
      fetchDocuments();
    } catch (err) {
      showError("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed bg-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-xs font-bold uppercase text-muted-foreground">Nom du document (ex: Manuel Utilisateur PDF)</label>
              <Input 
                placeholder="Titre du document..." 
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="w-full md:w-auto">
              <label className={cn(
                "flex items-center justify-center px-6 h-10 rounded-xl cursor-pointer transition-all font-bold text-sm",
                isUploading ? "bg-slate-100 text-slate-400" : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
              )}>
                {isUploading ? <Loader2 className="animate-spin mr-2" size={18} /> : <UploadCloud className="mr-2" size={18} />}
                {isUploading ? "Envoi..." : "Choisir & Envoyer"}
                <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading || !docName} />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
        ) : documents.length > 0 ? (
          documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-card border rounded-2xl hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileType size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{doc.name}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Ajouté le {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
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
                  <Trash2 size={18} />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl">
            <FileText className="mx-auto h-12 w-12 text-slate-200 mb-2" />
            <p className="text-sm text-muted-foreground">Aucun document technique pour cet équipement.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default AssetDocuments;