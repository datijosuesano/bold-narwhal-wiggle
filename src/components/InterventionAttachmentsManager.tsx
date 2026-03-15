"use client";

import React, { useState, useEffect } from "react";
import { UploadCloud, Link as LinkIcon, FileText, ImageIcon, Trash2, Loader2, ExternalLink, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface Attachment {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
}

interface InterventionAttachmentsManagerProps {
  interventionId: string;
  userId?: string;
}

const InterventionAttachmentsManager: React.FC<InterventionAttachmentsManagerProps> = ({ interventionId, userId }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const fetchAttachments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('intervention_attachments')
      .select('*')
      .eq('intervention_id', interventionId);
    if (!error) setAttachments(data || []);
    setIsLoading(false);
  };

  useEffect(() => { if (interventionId) fetchAttachments(); }, [interventionId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      setIsUploading(true);
      
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${interventionId}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("asset-documents") // On réutilise le même bucket par simplicité
        .upload(`interventions/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("asset-documents").getPublicUrl(`interventions/${fileName}`);

      const { error: dbError } = await supabase.from('intervention_attachments').insert({
        intervention_id: interventionId,
        user_id: userId,
        name: file.name,
        file_url: urlData.publicUrl,
        file_type: type
      });

      if (dbError) throw dbError;
      showSuccess("Fichier ajouté !");
      fetchAttachments();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkName || !linkUrl) return;
    setIsUploading(true);
    try {
      const { error } = await supabase.from('intervention_attachments').insert({
        intervention_id: interventionId,
        user_id: userId,
        name: linkName,
        file_url: linkUrl,
        file_type: 'link'
      });
      if (error) throw error;
      showSuccess("Lien ajouté !");
      setLinkName(""); setLinkUrl(""); setShowLinkInput(false);
      fetchAttachments();
    } catch (err: any) { showError(err.message); }
    finally { setIsUploading(false); }
  };

  const handleDelete = async (id: string, url: string) => {
    try {
      if (url.includes('supabase.co/storage')) {
        const path = url.split('asset-documents/')[1];
        if (path) await supabase.storage.from('asset-documents').remove([path]);
      }
      await supabase.from('intervention_attachments').delete().eq('id', id);
      setAttachments(prev => prev.filter(a => a.id !== id));
      showSuccess("Supprimé.");
    } catch (err) { showError("Erreur de suppression."); }
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black uppercase text-slate-500 tracking-wider">Documents & Photos</h4>
        <div className="flex gap-2">
          <label className="cursor-pointer bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors">
            <ImageIcon size={18} />
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} disabled={isUploading} />
          </label>
          <label className="cursor-pointer bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors">
            <FileText size={18} />
            <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'pdf')} disabled={isUploading} />
          </label>
          <Button variant="ghost" size="icon" className="bg-purple-50 text-purple-600" onClick={() => setShowLinkInput(!showLinkInput)}>
            <LinkIcon size={18} />
          </Button>
        </div>
      </div>

      {showLinkInput && (
        <div className="bg-slate-50 p-3 rounded-xl space-y-2 border animate-in fade-in zoom-in-95 duration-200">
          <Input placeholder="Nom du lien (ex: Vidéo test)" value={linkName} onChange={e => setLinkName(e.target.value)} className="h-8 text-xs rounded-lg" />
          <div className="flex gap-2">
            <Input placeholder="https://..." value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="h-8 text-xs rounded-lg flex-1" />
            <Button size="sm" onClick={handleAddLink} disabled={!linkUrl} className="h-8 rounded-lg bg-purple-600">Ajouter</Button>
          </div>
        </div>
      )}

      {isUploading && <div className="flex items-center justify-center py-2 text-[10px] text-blue-600 font-bold uppercase animate-pulse"><Loader2 className="animate-spin mr-2 h-3 w-3" /> Envoi en cours...</div>}

      <div className="grid gap-2">
        {attachments.map(att => (
          <div key={att.id} className="flex items-center justify-between p-2 bg-white border rounded-xl group hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                att.file_type === 'image' ? "bg-blue-50 text-blue-600" : att.file_type === 'pdf' ? "bg-red-50 text-red-600" : "bg-purple-50 text-purple-600"
              )}>
                {att.file_type === 'image' ? <ImageIcon size={14} /> : att.file_type === 'pdf' ? <FileText size={14} /> : <LinkIcon size={14} />}
              </div>
              <div className="max-w-[150px] sm:max-w-xs">
                <p className="text-xs font-bold text-slate-700 truncate">{att.name}</p>
                <Badge variant="outline" className="text-[8px] uppercase px-1 h-3">{att.file_type}</Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" asChild>
                <a href={att.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} /></a>
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(att.id, att.file_url)}>
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterventionAttachmentsManager;