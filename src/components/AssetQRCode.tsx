"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

interface AssetQRCodeProps {
  assetId: string;
  assetName: string;
  serialNumber: string;
}

const AssetQRCode: React.FC<AssetQRCodeProps> = ({ assetId, assetName, serialNumber }) => {
  // On génère l'URL absolue vers le portail de déclaration de panne
  const portalUrl = `${window.location.origin}/portal?assetId=${assetId}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Étiquette QR - ${assetName}</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .label { border: 2px solid #000; padding: 20px; text-align: center; width: 250px; border-radius: 10px; }
            .title { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
            .subtitle { font-size: 12px; color: #666; margin-bottom: 15px; }
            .footer { font-size: 10px; margin-top: 10px; font-weight: bold; color: #2563eb; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="title">${assetName}</div>
            <div class="subtitle">S/N: ${serialNumber}</div>
            <div id="qr-container"></div>
            <div class="footer">SCANNEZ POUR DÉCLARER UNE PANNE</div>
          </div>
          <script>
            // On clone le SVG du QR code pour l'impression
            const svg = window.opener.document.getElementById('asset-qr-${assetId}').outerHTML;
            document.getElementById('qr-container').innerHTML = svg;
            window.print();
            window.onafterprint = () => window.close();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl border shadow-sm space-y-4">
      <div className="bg-slate-50 p-4 rounded-xl border-2 border-dashed border-slate-200">
        <QRCodeSVG 
          id={`asset-qr-${assetId}`}
          value={portalUrl} 
          size={160}
          level="H"
          includeMargin={true}
        />
      </div>
      
      <div className="text-center">
        <p className="text-xs font-black uppercase text-blue-600 tracking-widest">Code QR d'Identification</p>
        <p className="text-[10px] text-muted-foreground mt-1">Lien direct vers le portail de maintenance</p>
      </div>

      <Button onClick={handlePrint} variant="outline" className="w-full rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50">
        <Printer size={16} className="mr-2" /> Imprimer l'étiquette
      </Button>
    </div>
  );
};

export default AssetQRCode;