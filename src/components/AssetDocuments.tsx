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
  asset_id: string;
}

interface AssetDocumentsProps {
  assetId: string;
}

const AssetDocuments: React.FC<AssetDocumentsProps> = ({ assetId }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchDocuments = async () => {
    if (!assetId) return;
    setIsLoading(true);
    // On filtre explicitement par asset_id
    const { data, error } = await supabase
      .from('asset_documents')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erreur documents:", error);
    } else {
      setDocuments(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchDocuments(); }, [assetId]);

  const handleDelete = async (id: string, url: string) => {
    try {
      if (url.includes('supabase.co/storage')) {
        const path = url.split('asset-documents/')[1];
        if (path) await supabase.storage.from('asset-documents').remove([path]);
      }
      const { error } = await supabase.from('asset_documents').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Document supprimé.");
      fetchDocuments();
    } catch (err) {
      showError("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
      ) : documents.length > 0 ? (
        <div className="grid gap-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-white border rounded-2xl hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileType size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{doc.name}</h4>
                  <Badge variant="outline" className="text-[8px] font-black uppercase px-2">{doc.category}</Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" asChild className="rounded-full text-blue-600">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download size={18} /></a>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full text-red-500" onClick={() => handleDelete(doc.id, doc.file_url)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-3xl bg-slate-50 text-slate-400">
          <FileText className="mx-auto h-10 w-10 opacity-20 mb-2" />
          <p className="text-xs">Aucun document pour cet équipement.</p>
        </div>
      )}
    </div>
  );
};

export default AssetDocuments;