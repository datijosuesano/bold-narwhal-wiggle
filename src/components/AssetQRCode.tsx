import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Laptop, Smartphone, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface AssetQRCodeProps {
  assetId: string;
  assetName: string;
  serialNumber: string;
}

const AssetQRCode: React.FC<AssetQRCodeProps> = ({
  assetId,
  assetName,
  serialNumber,
}) => {
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const safeAssetId = assetId.replace(/[^a-zA-Z0-9-]/g, "");

  const portalUrl = token
    ? `${baseUrl}/portal?token=${token}`
    : "";

  useEffect(() => {
    const loadToken = async () => {
      setLoading(true);

      // 1. chercher token existant
      const { data } = await supabase
        .from("portal_access_tokens")
        .select("*")
        .eq("asset_id", assetId)
        .eq("active", true)
        .maybeSingle();

      // 2. si existe → utiliser
      if (data?.token) {
        setToken(data.token);
        setLoading(false);
        return;
      }

      // 3. sinon créer un token
      const newToken =
        crypto.randomUUID?.() || Math.random().toString(36).substring(2);

      const { data: inserted, error } = await supabase
        .from("portal_access_tokens")
        .insert({
          asset_id: assetId,
          token: newToken,
          active: true,
        })
        .select()
        .single();

      if (!error && inserted) {
        setToken(inserted.token);
      }

      setLoading(false);
    };

    loadToken();
  }, [assetId]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !token) return;

    const doc = printWindow.document;
    doc.title = "Étiquette QR";

    const style = doc.createElement("style");
    style.textContent = `
      body { font-family: sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;}
      .label { border:2px solid #000; padding:20px; text-align:center; width:250px; border-radius:10px;}
      .title { font-weight:bold; font-size:18px; margin-bottom:5px;}
      .subtitle { font-size:12px; color:#666; margin-bottom:15px;}
      .footer { font-size:10px; margin-top:10px; font-weight:bold; color:#2563eb;}
    `;
    doc.head.appendChild(style);

    const label = doc.createElement("div");
    label.className = "label";

    const title = doc.createElement("div");
    title.className = "title";
    title.textContent = assetName;

    const subtitle = doc.createElement("div");
    subtitle.className = "subtitle";
    subtitle.textContent = `S/N: ${serialNumber}`;

    const qr = doc.createElement("div");

    const svg = document.getElementById(`asset-qr-${safeAssetId}`);
    if (svg) qr.appendChild(doc.importNode(svg, true));

    const footer = doc.createElement("div");
    footer.className = "footer";
    footer.textContent = "SCANNEZ POUR INTERVENIR";

    label.appendChild(title);
    label.appendChild(subtitle);
    label.appendChild(qr);
    label.appendChild(footer);

    doc.body.appendChild(label);

    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };

  if (loading) {
    return <p className="text-xs text-muted-foreground">Génération QR...</p>;
  }

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl border shadow-sm space-y-6">
      {isLocalhost && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800 rounded-xl">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-[11px]">
            Utilisez l’IP du PC pour test mobile.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-slate-50 p-4 rounded-2xl border-dashed border-2">
        <QRCodeSVG
          id={`asset-qr-${safeAssetId}`}
          value={portalUrl}
          size={180}
          level="H"
          includeMargin
        />
      </div>

      <p className="text-[9px] font-mono break-all">{portalUrl}</p>

      <Button
        onClick={handlePrint}
        className="w-full rounded-xl font-bold"
        disabled={!token}
      >
        <Printer className="mr-2" size={16} />
        Imprimer
      </Button>
    </div>
  );
};

export default AssetQRCode;