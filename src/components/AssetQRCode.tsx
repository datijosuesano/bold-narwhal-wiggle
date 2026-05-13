"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Laptop, Smartphone, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AssetQRCodeProps {
  assetId: string;
  assetName: string;
  serialNumber: string;
}

const AssetQRCode: React.FC<AssetQRCodeProps> = ({ assetId, assetName, serialNumber }) => {
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  // Sanitize assetId for use in DOM ID
  const safeAssetId = assetId.replace(/[^a-zA-Z0-9-]/g, '');
  const portalUrl = `${baseUrl}/portal?assetId=${assetId}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const doc = printWindow.document;
    doc.title = "Étiquette QR";

    // 1. Add styles securely
    const style = doc.createElement('style');
    style.textContent = `
      body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
      .label { border: 2px solid #000; padding: 20px; text-align: center; width: 250px; border-radius: 10px; }
      .title { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
      .subtitle { font-size: 12px; color: #666; margin-bottom: 15px; }
      .footer { font-size: 10px; margin-top: 10px; font-weight: bold; color: #2563eb; }
      #qr-container svg { width: 100%; height: auto; }
    `;
    doc.head.appendChild(style);

    // 2. Create structure using DOM APIs (prevents XSS)
    const label = doc.createElement('div');
    label.className = 'label';

    const titleDiv = doc.createElement('div');
    titleDiv.className = 'title';
    titleDiv.textContent = assetName;
    label.appendChild(titleDiv);

    const subtitleDiv = doc.createElement('div');
    subtitleDiv.className = 'subtitle';
    subtitleDiv.textContent = `S/N: ${serialNumber}`;
    label.appendChild(subtitleDiv);

    const qrContainer = doc.createElement('div');
    qrContainer.id = 'qr-container';
    
    // Safely clone the SVG element from the current document
    const svgElement = document.getElementById(`asset-qr-${safeAssetId}`);
    if (svgElement) {
      qrContainer.appendChild(doc.importNode(svgElement, true));
    }
    label.appendChild(qrContainer);

    const footerDiv = doc.createElement('div');
    footerDiv.className = 'footer';
    footerDiv.textContent = 'SCANNEZ POUR DÉCLARER UNE PANNE';
    label.appendChild(footerDiv);

    doc.body.appendChild(label);

    // 3. Print and handle window closure
    printWindow.print();
    
    // Use onafterprint to close the window after the print dialog is dismissed
    printWindow.onafterprint = () => printWindow.close();
    
    // Fallback for browsers that don't support onafterprint or block it
    setTimeout(() => {
      if (!printWindow.closed) printWindow.close();
    }, 500);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl border shadow-sm space-y-6">
      {isLocalhost && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800 rounded-xl">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-[11px] leading-tight">
            <b>Test Mobile :</b> Remplacez "localhost" par l'IP de votre PC (ex: 192.168.1.15) pour que votre téléphone puisse ouvrir le lien.
          </AlertDescription>
        </Alert>
      )}

      <div className="w-full space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">URL du serveur (pour le QR Code)</label>
        <div className="relative">
          <Laptop className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            value={baseUrl} 
            onChange={(e) => setBaseUrl(e.target.value)}
            className="pl-10 rounded-xl h-10 text-xs font-mono"
            placeholder="http://192.168.x.x:8080"
          />
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 relative group">
        <QRCodeSVG 
          id={`asset-qr-${safeAssetId}`}
          value={portalUrl} 
          size={180}
          level="H"
          includeMargin={true}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
           <Smartphone className="text-blue-600 animate-bounce" />
        </div>
      </div>
      
      <div className="text-center space-y-1">
        <p className="text-xs font-black uppercase text-blue-600 tracking-widest">Code QR d'Identification</p>
        <p className="text-[9px] text-muted-foreground break-all max-w-[200px] font-mono">{portalUrl}</p>
      </div>

      <div className="grid grid-cols-1 w-full gap-2">
        <Button onClick={handlePrint} variant="outline" className="w-full rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 h-11 font-bold">
          <Printer size={16} className="mr-2" /> Imprimer l'étiquette
        </Button>
      </div>
    </div>
  );
};

export default AssetQRCode;