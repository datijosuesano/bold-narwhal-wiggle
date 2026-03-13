"use client";

import React, { useState } from "react";
import { Loader2, X, UploadCloud, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  defaultValue?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload, defaultValue }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultValue || null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `assets/${fileName}`;

      // Tentative d'upload
      const { error: uploadError } = await supabase.storage
        .from("asset-images")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // Erreur spécifique si le bucket n'existe pas
        if (uploadError.message.includes("not found")) {
          throw new Error("Le dossier 'asset-images' n'est pas configuré dans Supabase Storage.");
        }
        throw uploadError;
      }

      // Récupération de l'URL publique
      const { data } = supabase.storage.from("asset-images").getPublicUrl(filePath);
      
      if (data?.publicUrl) {
        setPreview(data.publicUrl);
        onUpload(data.publicUrl);
        showSuccess("Image enregistrée !");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      showError(error.message || "Impossible d'envoyer l'image. Vérifiez vos permissions.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setPreview(null);
    onUpload("");
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {preview ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-dashed border-muted flex items-center justify-center bg-muted/30 group">
          <img src={preview} alt="Prévisualisation" className="w-full h-full object-contain" />
          <Button 
            variant="destructive" 
            size="icon" 
            type="button"
            className="absolute top-2 right-2 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={removeImage}
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-muted hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all">
          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
            {uploading ? (
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-2" />
            ) : (
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
            )}
            <p className="mb-2 text-sm text-muted-foreground font-semibold">
              {uploading ? "Envoi en cours..." : "Cliquez pour uploader une photo"}
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG (Max 5Mo)</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
};

export default ImageUpload;