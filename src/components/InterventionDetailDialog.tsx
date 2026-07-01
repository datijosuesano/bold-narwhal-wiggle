"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  AlertTriangle,
  User,
  Wrench,
  Package,
  History,
  Timer
} from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import InterventionAttachmentsManager from './InterventionAttachmentsManager';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import html2pdf from 'html2pdf.js';

interface Intervention {
  id: string;
  rit_number?: string | null;
  title: string;
  maintenance_type: string;
  intervention_date: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  description: string;
  asset_id: string;
  invoice_status: string;
  invoice_number: string;
  intervention_place: string;
  accessories_received?: string | null;
  client_signature_url?: string | null;
  technician_id?: string | null;
  user_id?: string | null;
  invoice_deposited_at?: string | null;
  assets: {
    name: string;
    location: string;
    brand?: string | null;
  } | null;
}
interface UsedPart {
  id: string;
  spare_part_id: string;
  quantity: number;
  unit_cost?: number;
  spare_parts?: {
    id: string;
    name: string;
    reference: string;
    purchase_cost?: number;
  } | null;
}

interface Technician {
  id: string;
  first_name?: string;
  last_name?: string;
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
  const [loading, setLoading] = useState(false);

const [technician, setTechnician] =
  useState<Technician | null>(null);

const [usedParts, setUsedParts] =
  useState<UsedPart[]>([]);

const printRef = useRef<HTMLDivElement>(null);
  // =========================
  // CHARGEMENT TECHNICIEN
  // =========================
 const loadDialogData = async () => {
  if (!intervention) return;

  setLoading(true);

  try {
    const targetId =
      intervention.technician_id || intervention.user_id;

    const [techResult, partsResult] = await Promise.all([
      targetId
        ? supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .eq("id", targetId)
            .maybeSingle()
        : Promise.resolve({ data: null }),

      supabase
        .from("intervention_parts")
        .select(`
          id,
          quantity,
          unit_cost,
          spare_part_id,
          spare_parts(
            id,
            name,
            reference,
            purchase_cost
          )
        `)
        .eq("intervention_id", intervention.id),
    ]);

    setTechnician(techResult.data);

    if (partsResult.error) {
      throw partsResult.error;
    }

    setUsedParts(partsResult.data ?? []);
  } catch (err) {
    console.error(err);

    setTechnician(null);
    setUsedParts([]);
  } finally {
    setLoading(false);
  }
};

  // =========================
  // CALCUL DURÉE D'INTERVENTION
  // =========================
  const durationString = useMemo(() => {
    if (!intervention?.start_date || !intervention?.end_date) return null;
    const start = new Date(intervention.start_date).getTime();
    const end = new Date(intervention.end_date).getTime();
    const diffMs = end - start;
    if (isNaN(diffMs) || diffMs < 0) return null;

    const diffMins = Math.floor(diffMs / (1000 * 60));
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
  // CALCUL TEMPS DE PRISE EN CHARGE
  // =========================
  const responseTimeString = useMemo(() => {
    if (!intervention?.created_at || !intervention?.start_date) return null;
    const requestDate = new Date(intervention.created_at);
    const startDate = new Date(intervention.start_date);
    
    const minutes = differenceInMinutes(startDate, requestDate);
    if (isNaN(minutes) || minutes < 0) return "Immédiat";

    const hours = differenceInHours(startDate, requestDate);
    const days = differenceInDays(startDate, requestDate);

    if (days > 0) {
      const remHours = hours % 24;
      return `${days}j ${remHours}h`;
    }
    if (hours > 0) {
      const remMins = minutes % 60;
      return `${hours}h ${remMins}m`;
    }
    return `${minutes} min`;
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
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(printRef.current).save();
      showSuccess("PDF généré avec succès !");
    } catch (error) {
      console.error(error);
      showError("Erreur génération PDF.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!intervention) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0 bg-white">
        
        {/* CONTENU IMPRIMABLE */}
        <div ref={printRef} className="p-6 space-y-6 print-intervention-area bg-white">
          
          {/* HEADER */}
          <DialogHeader className="border-b pb-4 flex flex-row justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl print:border",
                intervention.intervention_place === "Sur Site"
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-purple-50 text-purple-600 border-purple-200"
              )}>
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
              <Button onClick={handleExportPDF} size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9">
                <Download size={16} className="mr-1.5" /> Exporter PDF
              </Button>
              <Button onClick={handlePrint} size="sm" variant="outline" className="rounded-xl border-slate-200 font-bold h-9">
                <Printer size={16} className="mr-1.5" /> Imprimer
              </Button>
            </div>
          </DialogHeader>

          {/* RIT OFFICIAL BANNER */}
          <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100 print:bg-transparent print:border-slate-300">
            <div className="flex items-center gap-2 text-blue-800 print:text-black">
              <FileSpreadsheet size={16} />
              <span className="text-xs font-black uppercase tracking-wider">
                Rapport d'Intervention Technique
              </span>
            </div>
            <Badge className="bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-lg print:bg-black">
              {intervention.rit_number || "RIT SANS NUMÉRO"}
            </Badge>
          </div>

          {/* DÉLAIS ET TEMPS DE RÉACTION */}
          <div className="grid grid-cols-2 gap-4">
            {durationString && (
              <div className="p-3 bg-slate-950 text-white rounded-xl flex flex-col justify-between shadow print:bg-slate-50 print:text-black print:border">
                <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 text-slate-400">
                  <Clock size={11} className="text-slate-400" />
                  Durée intervention
                </span>
                <strong className="text-base font-black mt-1">
                  {durationString}
                </strong>
              </div>
            )}

            {responseTimeString && (
              <div className="p-3 bg-slate-950 text-white rounded-xl flex flex-col justify-between shadow print:bg-slate-50 print:text-black print:border">
                <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 text-slate-400">
                  <Timer size={11} className="text-slate-400" />
                  Temps de Prise en charge
                </span>
                <strong className="text-base font-black mt-1">
                  {responseTimeString}
                </strong>
              </div>
            )}
          </div>

          {/* INFORMATIONS GÉNÉRALES */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border print:bg-transparent print:border-slate-300">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400">Équipement</p>
              <p className="font-bold text-slate-800 mt-0.5">
                {intervention.assets?.name}
                {intervention.assets?.brand && (
                  <span className="text-xs font-medium text-slate-500 ml-1.5">
                    ({intervention.assets.brand})
                  </span>
                )}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase text-slate-400">Date intervention</p>
              <p className="font-bold text-slate-800 mt-0.5">
                {format(new Date(intervention.intervention_date), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase text-slate-400">Type de maintenance</p>
              <Badge variant="outline" className="mt-1 text-[9px] uppercase font-bold bg-white text-slate-700 border-slate-200">
                {intervention.maintenance_type}
              </Badge>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase text-slate-400">Technicien Responsable</p>
              <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                <User size={12} className="text-blue-500" />
                {techName || "Non assigné"}
              </p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase text-slate-400 flex items-center gap-1">
              <FileText size={14} />
              Description des travaux réalisés
            </h4>
            <p className="text-sm text-slate-700 bg-white p-3 rounded-xl border leading-relaxed whitespace-pre-wrap">
              {intervention.description || "Aucun détail complémentaire renseigné."}
            </p>
          </div>

          {/* PIÈCES DE RECHANGE UTILISÉES (Priorité 3) */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase text-slate-400 flex items-center gap-1">
              <Package size={14} className="text-slate-400" />
              Pièces de rechange utilisées
            </h4>
            {usedParts.length > 0 ? (
              <div className="border rounded-xl divide-y bg-white overflow-hidden text-xs">
                {usedParts.map((part, index) => (
                  <div key={index} className="p-3 flex justify-between items-center hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-800">{part.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">Ref: {part.ref}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="font-bold rounded-lg text-[10px]">Qté: {part.quantity}</Badge>
                      <p className="text-[9px] text-emerald-600 font-bold uppercase mt-0.5">{part.source}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 border border-dashed rounded-xl text-slate-400 text-xs italic">
                <PackageOpen size={16} className="mx-auto mb-1 opacity-55" />
                Aucune pièce de rechange remplacée sur cette intervention.
              </div>
            )}
          </div>

          {/* ACCESSOIRES */}
          {intervention.intervention_place === "Atelier / Service Technique" && (
            <div className="bg-purple-50/40 border border-purple-100 p-4 rounded-xl">
              <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs uppercase tracking-wider">
                <PackageOpen size={16} />
                Accessoires reçus à l'atelier
              </div>
              <p className="text-sm text-slate-700 font-medium mt-2">
                {intervention.accessories_received || "Aucun accessoire renseigné."}
              </p>
            </div>
          )}

          {/* HISTORIQUE ADMINISTRATIF (Priorité 5) */}
          <div className="space-y-2 pt-2 border-t">
            <h4 className="text-xs font-black uppercase text-slate-400 flex items-center gap-1">
              <History size={14} className="text-slate-400" />
              Historique Administratif & Facturation
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl border flex flex-col gap-2.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Création de la demande (OT) :</span>
                <span className="font-bold text-slate-700">{format(new Date(intervention.created_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              {intervention.start_date && (
                <div className="flex justify-between items-center">
                  <span>Prise en charge technique :</span>
                  <span className="font-bold text-slate-700">{format(new Date(intervention.start_date), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
              {intervention.end_date && (
                <div className="flex justify-between items-center">
                  <span>Fin d'intervention technique :</span>
                  <span className="font-bold text-slate-700">{format(new Date(intervention.end_date), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
              {intervention.invoice_deposited_at && (
                <div className="flex justify-between items-center">
                  <span>Dépôt de la facture administrative :</span>
                  <span className="font-bold text-slate-700">{format(new Date(intervention.invoice_deposited_at), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Statut de la facturation :</span>
                {getStatusBadge(intervention.invoice_status)}
              </div>
            </div>
          </div>

          {/* SIGNATURE CLIENT */}
          {intervention.client_signature_url && (
            <div className="pt-2">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">
                Signature validée du Client
              </p>
              <div className="border rounded-lg p-2 bg-white inline-block shadow-inner">
                <img
                  src={intervention.client_signature_url}
                  alt="Signature"
                  className="max-h-16 w-auto object-contain"
                />
              </div>
            </div>
          )}

          <Separator className="print:hidden" />

          {/* PIECES JOINTES / MÉDIAS */}
          <div className="print:hidden">
            <InterventionAttachmentsManager
              interventionId={intervention.id}
            />
          </div>

        </div>
      </DialogContent>

      {/* STYLE IMPRESSION UNIQUE */}
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