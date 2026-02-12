"use client";

import React, { useState } from "react";
import { Camera, Loader2, X, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

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
        throw new Error("Vous devez sélectionner une image.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `assets/${fileName}`;

      // Upload de l'image (assurez-vous d'avoir un bucket 'asset-images' public)
      const { error: uploadError } = await supabase.storage
        .from("asset-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("asset-images").getPublicUrl(filePath);
      
      setPreview(data.publicUrl);
      onUpload(data.publicUrl);
    } catch (error: any) {
      showError(error.message);
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
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-dashed border-muted flex items-center justify-center bg-muted/30">
          <img src={preview} alt="Prévisualisation" className="w-full h-full object-contain" />
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute top-2 right-2 rounded-full h-8 w-8"
            onClick={removeImage}
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-muted hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-2" />
            ) : (
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
            )}
            <p className="mb-2 text-sm text-muted-foreground font-semibold">
              {uploading ? "Envoi en cours..." : "Cliquez pour uploader la photo"}
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG (Max 5MB)</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
};

export default ImageUpload;