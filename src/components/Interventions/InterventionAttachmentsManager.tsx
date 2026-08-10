"use client";

import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  Link as LinkIcon,
  FileText,
  ImageIcon,
  Trash2,
  Loader2,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

/* =========================
   TYPES
========================= */

type Attachment = {
  id: string;
  intervention_id: string | null;
  user_id: string | null;
  name: string;
  file_url: string;
  file_type: "image" | "pdf" | "link";
  created_at?: string;
};

/* =========================
   COMPONENT
========================= */

interface Props {
  interventionId: string;
  userId?: string;
}

const InterventionAttachmentsManager: React.FC<Props> = ({
  interventionId,
  userId,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  /* =========================
     FETCH ATTACHMENTS
  ========================= */

  const fetchAttachments = async () => {
    if (!interventionId) return;

    setIsLoading(true);

    const { data, error } = await supabase
      .from("intervention_attachments")
      .select("*")
      .eq("intervention_id", interventionId)
      .order("created_at", { ascending: false });

    if (error) {
      showError(error.message);
    } else {
      setAttachments(data || []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchAttachments();
  }, [interventionId]);

  /* =========================
     FILE UPLOAD
  ========================= */

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "pdf"
  ) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);

      const filePath = `interventions/${interventionId}/${Date.now()}-${file.name}`;

      // 1. Upload storage
      const { error: uploadError } = await supabase.storage
        .from("intervention-docs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("intervention-docs")
        .getPublicUrl(filePath);

      // 2. DB insert
      const { error: dbError } = await supabase
        .from("intervention_attachments")
        .insert({
          intervention_id: interventionId,
          user_id: userId ?? null,
          name: file.name,
          file_url: urlData.publicUrl,
          file_type: type,
        });

      if (dbError) throw dbError;

      showSuccess("Fichier enregistré !");
      fetchAttachments();
    } catch (error: any) {
      showError(error.message || "Erreur upload");
    } finally {
      setIsUploading(false);
    }
  };

  /* =========================
     ADD LINK
  ========================= */

  const handleAddLink = async () => {
    if (!linkName || !linkUrl) return;

    setIsUploading(true);

    try {
      const { error } = await supabase
        .from("intervention_attachments")
        .insert({
          intervention_id: interventionId,
          user_id: userId ?? null,
          name: linkName,
          file_url: linkUrl,
          file_type: "link",
        });

      if (error) throw error;

      showSuccess("Lien ajouté !");

      setLinkName("");
      setLinkUrl("");
      setShowLinkInput(false);

      fetchAttachments();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  /* =========================
     DELETE ATTACHMENT
  ========================= */

  const handleDelete = async (id: string) => {
    try {
      const att = attachments.find((a) => a.id === id);
      if (!att) return;

      // delete storage si fichier réel
      if (att.file_type !== "link") {
        const parts = att.file_url.split("/object/public/");
        if (parts.length > 1) {
          const path = parts[1];

          await supabase.storage
            .from("intervention-docs")
            .remove([path]);
        }
      }

      const { error } = await supabase
        .from("intervention_attachments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAttachments((prev) => prev.filter((a) => a.id !== id));
      showSuccess("Supprimé.");
    } catch (err: any) {
      showError(err.message || "Erreur suppression");
    }
  };

  /* =========================
     UI
  ========================= */

  return (
    <div className="space-y-4 pt-4 border-t">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black uppercase text-slate-500 tracking-wider">
          Documents & Photos
        </h4>

        <div className="flex gap-2">

          {/* IMAGE */}
          <label className="cursor-pointer bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100">
            <ImageIcon size={18} />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, "image")}
              disabled={isUploading}
            />
          </label>

          {/* PDF */}
          <label className="cursor-pointer bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100">
            <FileText size={18} />
            <input
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={(e) => handleFileUpload(e, "pdf")}
              disabled={isUploading}
            />
          </label>

          {/* LINK */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-purple-50 text-purple-600"
            onClick={() => setShowLinkInput(!showLinkInput)}
          >
            <LinkIcon size={18} />
          </Button>
        </div>
      </div>

      {/* LINK INPUT */}
      {showLinkInput && (
        <div className="bg-slate-50 p-3 rounded-xl space-y-2 border">
          <Input
            placeholder="Nom du lien"
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            className="h-8 text-xs"
          />

          <div className="flex gap-2">
            <Input
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="h-8 text-xs flex-1"
            />

            <Button
              size="sm"
              onClick={handleAddLink}
              disabled={!linkUrl}
              className="bg-purple-600"
            >
              Ajouter
            </Button>
          </div>
        </div>
      )}

      {/* LOADING */}
      {isUploading && (
        <div className="flex items-center justify-center text-xs text-blue-600">
          <Loader2 className="animate-spin w-3 h-3 mr-2" />
          Upload...
        </div>
      )}

      {/* LIST */}
      <div className="grid gap-2">

        {attachments.map((att) => (
          <div
            key={att.id}
            className="flex items-center justify-between p-2 border rounded-xl bg-white"
          >

            {/* LEFT */}
            <div className="flex items-center gap-3">

              <div
                className={cn(
                  "p-2 rounded-lg",
                  att.file_type === "image"
                    ? "bg-blue-50 text-blue-600"
                    : att.file_type === "pdf"
                    ? "bg-red-50 text-red-600"
                    : "bg-purple-50 text-purple-600"
                )}
              >
                {att.file_type === "image" ? (
                  <ImageIcon size={14} />
                ) : att.file_type === "pdf" ? (
                  <FileText size={14} />
                ) : (
                  <LinkIcon size={14} />
                )}
              </div>

              <p className="text-xs font-bold truncate max-w-[180px]">
                {att.name}
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-1">

              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={12} />
                </a>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500"
                onClick={() => handleDelete(att.id)}
              >
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