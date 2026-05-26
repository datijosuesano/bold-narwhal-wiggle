"use client";

import React, { useEffect, useState, useRef } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import {
  MapPin,
  Warehouse,
  PackageOpen,
  FileText,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  FileSpreadsheet,
  Printer,
  Download,
  AlertTriangle
} from 'lucide-react';

import { format } from 'date-fns';

import { fr } from 'date-fns/locale';

import { cn } from '@/lib/utils';

import { Separator } from '@/components/ui/separator';

import InterventionAttachmentsManager from './InterventionAttachmentsManager';

import { supabase } from '@/integrations/supabase/client';

import {
  showSuccess,
  showError
} from '@/utils/toast';

import html2pdf from 'html2pdf.js';

interface Intervention {

  id: string;

  rit_number?: string | null;

  title: string;

  maintenance_type: string;

  intervention_date: string;

  start_date?: string | null;

  end_date?: string | null;

  description: string;

  asset_id: string;

  invoice_status: string;

  invoice_number: string;

  intervention_place: string;

  accessories_received?: string | null;

  client_signature_url?: string | null;

  assets: {
    name: string;
    location: string;
    brand?: string | null;
  } | null;
}

interface InterventionDetailDialogProps {

  intervention: Intervention | null;

  isOpen: boolean;

  onClose: () => void;
}

const getStatusBadge = (status: string) => {

  switch (status) {

    case 'Facture déposée':

      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full">
          <CheckCircle2 size={12} className="mr-1" />
          Déposée
        </Badge>
      );

    case 'Sous garantie':

      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full">
          <ShieldCheck size={12} className="mr-1" />
          Garantie
        </Badge>
      );

    case 'Sous contrat':

      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200 rounded-full">
          <ShieldAlert size={12} className="mr-1" />
          Contrat
        </Badge>
      );

    default:

      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-full">
          <XCircle size={12} className="mr-1" />
          Non déposée
        </Badge>
      );
  }
};

const InterventionDetailDialog: React.FC<InterventionDetailDialogProps> = ({
  intervention,
  isOpen,
  onClose
}) => {

  const [techName, setTechName] = useState<string>("");

  const printRef = useRef<HTMLDivElement>(null);

  // =========================
  // CHARGEMENT TECHNICIEN
  // =========================

  useEffect(() => {

    const fetchTech = async () => {

      if (!intervention) return;

      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq(
          'id',
          (intervention as any).technician_id ||
          (intervention as any).user_id
        )
        .maybeSingle();

      if (data) {

        setTechName(
          `${data.first_name} ${data.last_name}`
        );
      }
    };

    if (isOpen && intervention) {

      fetchTech();
    }

  }, [isOpen, intervention]);

  // =========================
  // CALCUL DUREE
  // =========================

  const durationString = React.useMemo(() => {

    if (
      !intervention?.start_date ||
      !intervention?.end_date
    ) return null;

    const start = new Date(
      intervention.start_date
    ).getTime();

    const end = new Date(
      intervention.end_date
    ).getTime();

    const diffMs = end - start;

    if (isNaN(diffMs) || diffMs < 0) return null;

    const diffMins = Math.floor(
      diffMs / (1000 * 60)
    );

    const hours = Math.floor(diffMins / 60);

    const mins = diffMins % 60;

    const days = Math.floor(hours / 24);

    if (days > 0) {

      const remainingHours = hours % 24;

      return `${days}j ${remainingHours}h ${mins}min`;
    }

    if (hours > 0) {

      return `${hours}h ${mins}min`;
    }

    return `${mins} min`;

  }, [intervention]);

  // =========================
  // EXPORT PDF
  // =========================

  const handleExportPDF = async () => {

    try {

      if (!printRef.current) return;

      const opt = {

        margin: 0.4,

        filename: `RIT-${intervention?.rit_number || intervention?.id}.pdf`,

        image: {
          type: 'jpeg',
          quality: 1
        },

        html2canvas: {
          scale: 2,
          useCORS: true,
          scrollY: 0
        },

        jsPDF: {
          unit: 'in',
          format: 'a4',
          orientation: 'portrait'
        },

        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy']
        }
      };

      await html2pdf()
        .set(opt)
        .from(printRef.current)
        .save();

      showSuccess("PDF généré avec succès !");

    } catch (error) {

      console.error(error);

      showError("Erreur génération PDF.");
    }
  };

  // =========================
  // IMPRESSION
  // =========================

  const handlePrint = () => {

    window.print();
  };

  if (!intervention) return null;

  return (

    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >

      <DialogContent className="sm:max-w-[550px] rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0 bg-white">

        {/* CONTENU IMPRIMABLE */}

        <div
          ref={printRef}
          className="p-6 space-y-5 print-intervention-area bg-white"
        >

          {/* HEADER */}

          <DialogHeader className="border-b pb-4 flex flex-row justify-between items-start">

            <div className="flex items-center gap-3">

              <div
                className={cn(
                  "p-2.5 rounded-xl print:border",
                  intervention.intervention_place === "Sur Site"
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-purple-50 text-purple-600 border-purple-200"
                )}
              >

                {intervention.intervention_place === "Sur Site"
                  ? <MapPin size={24} />
                  : <Warehouse size={24} />
                }

              </div>

              <div className="text-left flex-1">

                <DialogTitle className="text-xl font-bold leading-tight">

                  {intervention.title}

                </DialogTitle>

                <DialogDescription className="text-xs mt-0.5">

                  {intervention.intervention_place}
                  {" • "}
                  {intervention.assets?.location}

                </DialogDescription>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="flex gap-2 print:hidden">

              <Button
                onClick={handleExportPDF}
                size="sm"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >

                <Download size={16} className="mr-1.5" />

                PDF

              </Button>

              <Button
                onClick={handlePrint}
                size="sm"
                variant="outline"
                className="rounded-xl border-slate-200"
              >

                <Printer size={16} className="mr-1.5" />

                Imprimer

              </Button>

            </div>

          </DialogHeader>

          {/* RIT */}

          <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100 print:bg-transparent print:border-slate-300">

            <div className="flex items-center gap-2 text-blue-800 print:text-black">

              <FileSpreadsheet size={16} />

              <span className="text-xs font-black uppercase tracking-wider">

                Rapport officiel

              </span>

            </div>

            <Badge className="bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-lg print:bg-black">

              {intervention.rit_number || "RIT SANS NUMÉRO"}

            </Badge>

          </div>

          {/* DUREE */}

          {durationString && (

            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow print:bg-slate-100 print:text-black print:border">

              <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">

                <Clock size={14} />

                Durée intervention

              </span>

              <strong className="text-base font-black">

                {durationString}

              </strong>

            </div>

          )}

          {/* INFOS */}

          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50/50 p-4 rounded-xl border print:bg-transparent print:border-slate-300">

            <div>

              <p className="text-[10px] font-black uppercase text-slate-400">

                Équipement

              </p>

              <p className="font-bold text-slate-800">

                {intervention.assets?.name}

                {intervention.assets?.brand && (

                  <span className="text-xs font-medium text-slate-500 ml-1">

                    ({intervention.assets.brand})

                  </span>

                )}

              </p>

            </div>

            <div>

              <p className="text-[10px] font-black uppercase text-slate-400">

                Date intervention

              </p>

              <p className="font-bold text-slate-800">

                {format(
                  new Date(intervention.intervention_date),
                  'dd MMMM yyyy',
                  { locale: fr }
                )}

              </p>

            </div>

            <div>

              <p className="text-[10px] font-black uppercase text-slate-400">

                Maintenance

              </p>

              <Badge
                variant="outline"
                className="mt-1 text-[10px] uppercase font-bold"
              >

                {intervention.maintenance_type}

              </Badge>

            </div>

            <div>

              <p className="text-[10px] font-black uppercase text-slate-400">

                Technicien

              </p>

              <p className="font-bold text-slate-700 text-xs mt-1">

                {techName || "Non spécifié"}

              </p>

            </div>

          </div>

          {/* DESCRIPTION */}

          <div className="space-y-1.5">

            <h4 className="text-xs font-black uppercase text-slate-400 flex items-center gap-1">

              <FileText size={14} />

              Description des travaux

            </h4>

            <p className="text-sm text-slate-700 bg-white p-3 rounded-xl border leading-relaxed whitespace-pre-wrap">

              {intervention.description ||
                "Aucun détail complémentaire renseigné."}

            </p>

          </div>

          {/* ACCESSOIRES */}

          {intervention.intervention_place === "Atelier / Service Technique" && (

            <div className="bg-purple-50/40 border border-purple-100 p-4 rounded-xl">

              <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs uppercase tracking-wider">

                <PackageOpen size={16} />

                Accessoires reçus

              </div>

              <p className="text-sm text-slate-700 font-medium mt-2">

                {intervention.accessories_received ||

                  "Aucun accessoire renseigné."}

              </p>

            </div>

          )}

          {/* FACTURATION */}

          <div className="pt-2">

            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">

              Statut Facturation

            </p>

            {getStatusBadge(intervention.invoice_status)}

          </div>

          {/* SIGNATURE */}

          {intervention.client_signature_url && (

            <div>

              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">

                Signature Client

              </p>

              <div className="border rounded-lg p-2 bg-white inline-block">

                <img
                  src={intervention.client_signature_url}
                  alt="Signature"
                  className="max-h-16 w-auto object-contain"
                />

              </div>

            </div>

          )}

          <Separator className="print:hidden" />

          {/* PIECES JOINTES */}

          <div className="print:hidden">

            <InterventionAttachmentsManager
              interventionId={intervention.id}
            />

          </div>

        </div>

      </DialogContent>

      {/* STYLE IMPRESSION */}

      <style>{`

        @media print {

          body * {
            visibility: hidden;
          }

          .print-intervention-area,
          .print-intervention-area * {

            visibility: visible;
          }

          .print-intervention-area {

            position: absolute;

            left: 0;

            top: 0;

            width: 100%;

            background: white;

            padding: 20px;
          }

          .print\\:hidden,
          button,
          nav,
          aside,
          footer,
          header {

            display: none !important;
          }

          .shadow,
          .shadow-md,
          .shadow-lg {

            box-shadow: none !important;
          }
        }

      `}</style>

    </Dialog>
  );
};

export default InterventionDetailDialog;