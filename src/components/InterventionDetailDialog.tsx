"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wrench, Calendar, MapPin, Warehouse, PackageOpen, 
  DollarSign, FileText, CheckCircle2, XCircle, ShieldCheck, ShieldAlert, Clock, FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import InterventionAttachmentsManager from './InterventionAttachmentsManager';
import { supabase } from '@/integrations/supabase/client';

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
      return <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full"><CheckCircle2 size={12} className="mr-1" /> Déposée</Badge>;
    case 'Sous garantie': 
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full"><ShieldCheck size={12} className="mr-1" /> Garantie</Badge>;
    case 'Sous contrat': 
      return <Badge className="bg-purple-100 text-purple-700 border-purple-200 rounded-full"><ShieldAlert size={12} className="mr-1" /> Contrat</Badge>;
    default: 
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-full"><XCircle size={12} className="mr-1" /> Non déposée</Badge>;
  }
};

const InterventionDetailDialog: React.FC<InterventionDetailDialogProps> = ({ intervention, isOpen, onClose }) => {
  const [techName, setTechName] = useState<string>("");

  useEffect(() => {
    const fetchTech = async () => {
      if (!intervention) return;
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', (intervention as any).technician_id || (intervention as any).user_id)
        .maybeSingle();
      
      if (data) {
        setTechName(`${data.first_name} ${data.last_name}`);
      }
    };
    if (isOpen && intervention) {
      fetchTech();
    }
  }, [isOpen, intervention]);

  // Calculateur de durée
  const durationString = React.useMemo(() => {
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

  if (!intervention) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] rounded-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl",
              intervention.intervention_place === "Sur Site" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
            )}>
              {intervention.intervention_place === "Sur Site" ? <MapPin size={24} /> : <Warehouse size={24} />}
            </div>
            <div className="text-left flex-1">
              <DialogTitle className="text-xl font-bold leading-tight flex items-center gap-2">
                {intervention.title}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {intervention.intervention_place} • {intervention.assets?.location}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Nouveau Badge RIT prominent */}
          <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-800">
              <FileSpreadsheet size={16} />
              <span className="text-xs font-black uppercase tracking-wider">Rapport officiel</span>
            </div>
            <Badge className="bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-lg">
              {intervention.rit_number || "RIT SANS NUMÉRO"}
            </Badge>
          </div>

          {/* Durée Calculée Prominente */}
          {durationString && (
            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow">
              <span className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5"><Clock size={14} /> Durée de l'intervention</span>
              <strong className="text-base font-black text-green-400">{durationString}</strong>
            </div>
          )}

          {/* Main Info */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50/50 p-4 rounded-xl border">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Équipement</p>
              <p className="font-bold text-slate-800">{intervention.assets?.name || 'Inconnu'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Date d'intervention</p>
              <p className="font-bold text-slate-800">
                {format(new Date(intervention.intervention_date), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Type de maintenance</p>
              <Badge variant="outline" className="mt-1 text-[10px] uppercase font-bold">{intervention.maintenance_type}</Badge>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Technicien</p>
              <p className="font-bold text-slate-700 text-xs mt-1">{techName || "Non spécifié"}</p>
            </div>
          </div>

          {/* Heures précises */}
          {(intervention.start_date || intervention.end_date) && (
            <div className="text-xs space-y-1 p-3 border rounded-xl bg-slate-50/20">
              {intervention.start_date && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Heure d'arrivée / début :</span>
                  <span className="font-bold text-slate-800">{format(new Date(intervention.start_date), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
              {intervention.end_date && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase tracking-wider">Heure de clôture / fin :</span>
                  <span className="font-bold text-slate-800">{format(new Date(intervention.end_date), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
            </div>
          )}

          {/* Workshop accessories received */}
          {intervention.intervention_place === "Atelier / Service Technique" && (
            <div className="bg-purple-50/40 border border-purple-100 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs uppercase tracking-wider">
                <PackageOpen size={16} />
                <span>Accessoires Reçus</span>
              </div>
              <p className="text-sm text-slate-700 font-medium">
                {intervention.accessories_received ? (
                  intervention.accessories_received
                ) : (
                  <span className="text-slate-400 italic font-normal">Aucun accessoire renseigné lors du dépôt.</span>
                )}
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase text-slate-400 flex items-center gap-1">
              <FileText size={14} /> Description des travaux
            </h4>
            <p className="text-sm text-slate-700 bg-white p-3 rounded-xl border leading-relaxed whitespace-pre-wrap">
              {intervention.description || "Aucun détail complémentaire renseigné."}
            </p>
          </div>

          {/* Cost and Signature */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Statut Facturation</p>
              <div className="mt-1">{getStatusBadge(intervention.invoice_status)}</div>
            </div>
            {intervention.client_signature_url && (
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">Signature Client</p>
                <div className="mt-1 border rounded-lg p-1 bg-white inline-block max-w-[150px]">
                  <img src={intervention.client_signature_url} alt="Signature" className="max-h-12 w-auto object-contain" />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Attachments Section */}
          <InterventionAttachmentsManager interventionId={intervention.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterventionDetailDialog;