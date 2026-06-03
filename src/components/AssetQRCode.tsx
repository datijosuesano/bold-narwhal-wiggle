import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, Power, PowerOff, ShieldCheck, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const safeAssetId = assetId.replace(/[^a-zA-Z0-9-]/g, "");
  const portalUrl = token ? `${baseUrl}/portal?token=${token}` : "";

  const loadToken = async () => {
    setLoading(true);
    try {
      // Rechercher le token le plus récent pour cet équipement (actif ou inactif)
      const { data, error } = await supabase
        .from("portal_access_tokens")
        .select("*")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setToken(data.token);
        setIsActive(data.active);
      } else {
        // Si aucun token n'existe, on en génère un par défaut (actif)
        const newToken = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
        const { data: inserted, error: insertError } = await supabase
          .from("portal_access_tokens")
          .insert({
            asset_id: assetId,
            token: newToken,
            active: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (inserted) {
          setToken(inserted.token);
          setIsActive(true);
        }
      }
    } catch (err: any) {
      console.error("Erreur de chargement du token QR:", err);
      showError("Impossible de configurer l'accès portail de cet appareil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadToken();
  }, [assetId]);

  // Désactiver ou réactiver le Token QR Code
  const handleToggleActive = async () => {
    if (!token) return;
    setActionLoading(true);
    const targetStatus = !isActive;

    try {
      const { error } = await supabase
        .from("portal_access_tokens")
        .update({ active: targetStatus })
        .eq("token", token);

      if (error) throw error;

      setIsActive(targetStatus);
      showSuccess(
        targetStatus 
          ? "QR Code réactivé avec succès ! L'accès au portail est rétabli." 
          : "QR Code désactivé avec succès ! Le portail client est désormais verrouillé."
      );
    } catch (err: any) {
      console.error("Erreur toggle active:", err);
      showError("Une erreur est survenue lors de la modification de l'accès.");
    } finally {
      setActionLoading(false);
    }
  };

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
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl border shadow-sm space-y-6">
      
      {/* Alerte du statut d'activité */}
      <div className="w-full">
        {isActive ? (
          <Alert className="bg-green-50 border-green-200 text-green-800 rounded-xl">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <AlertTitle className="font-bold text-xs uppercase">Accès Activé</AlertTitle>
            <AlertDescription className="text-[11px] text-green-700 leading-tight">
              Le QR Code est actuellement opérationnel. Les clients peuvent scanner pour signaler une panne.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-red-50 border-red-200 text-red-800 rounded-xl">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <AlertTitle className="font-bold text-xs uppercase">Accès Désactivé</AlertTitle>
            <AlertDescription className="text-[11px] text-red-700 leading-tight">
              L'accès à cet équipement est coupé. Toute personne scannant ce QR Code obtiendra un message d'accès refusé.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className={cn(
        "bg-slate-50 p-4 rounded-2xl border-dashed border-2 relative",
        !isActive && "opacity-25"
      )}>
        <QRCodeSVG
          id={`asset-qr-${safeAssetId}`}
          value={portalUrl}
          size={180}
          level="H"
          includeMargin
        />
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
            <Badge variant="destructive" className="rounded-full text-[10px] font-black uppercase tracking-wider px-3 py-1">INACTIF</Badge>
          </div>
        )}
      </div>

      <p className="text-[9px] font-mono break-all text-muted-foreground bg-slate-50 p-2 rounded border w-full text-center">
        {portalUrl || "En attente de token..."}
      </p>

      <div className="flex flex-col gap-2 w-full">
        <Button
          onClick={handlePrint}
          className="w-full rounded-xl font-bold h-11 bg-blue-600 hover:bg-blue-700"
          disabled={!token || !isActive}
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimer l'étiquette
        </Button>

        <Button
          variant={isActive ? "destructive" : "secondary"}
          onClick={handleToggleActive}
          disabled={actionLoading || !token}
          className="w-full rounded-xl font-bold h-11"
        >
          {actionLoading ? (
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
          ) : isActive ? (
            <>
              <PowerOff className="mr-2 h-4 w-4" />
              Désactiver l'accès QR Code
            </>
          ) : (
            <>
              <Power className="mr-2 h-4 w-4" />
              Réactiver l'accès QR Code
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AssetQRCode;