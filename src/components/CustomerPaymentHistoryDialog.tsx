"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { History, Loader2, Banknote, CalendarDays, FileText, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PaymentHistory {
  id: string;
  amount: number;
  payment_method: string;
  reference: string | null;
  created_at: string;
}

interface CustomerPaymentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: { id: string; name: string } | null;
}

const CustomerPaymentHistoryDialog: React.FC<CustomerPaymentHistoryDialogProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // États pour l'impression du reçu sélectionné
  const printRef = useRef<HTMLDivElement>(null);
  const [activeReceipt, setActiveReceipt] = useState<PaymentHistory | null>(null);

  const triggerPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Recu_Paiement_${customer?.name.replace(/\s+/g, '_')}`,
    onAfterPrint: () => setActiveReceipt(null),
  });

  // Déclencher l'impression dès que la structure HTML du reçu est chargée
  useEffect(() => {
    if (activeReceipt) {
      setTimeout(() => {
        triggerPrint();
      }, 150);
    }
  }, [activeReceipt, triggerPrint]);

  useEffect(() => {
    if (isOpen && customer) {
      const fetchHistory = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from("customer_payments")
            .select("*")
            .eq("customer_id", customer.id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          setPayments(data || []);
        } catch (err) {
          console.error("Erreur chargement historique:", err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchHistory();
    }
  }, [isOpen, customer]);

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + " FCFA";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl rounded-2xl bg-white max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b pb-4 shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <History className="text-blue-600" size={20} /> Historique des Paiements
          </DialogTitle>
          <DialogDescription>
            Registre des versements effectués par <strong>{customer?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
            </div>
          ) : payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between hover:border-blue-200 transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                      <Banknote size={18} />
                    </div>
                    <div>
                      <div className="font-black text-slate-800 text-lg">
                        {formatFCFA(payment.amount)}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium mt-1">
                        <span className="flex items-center"><CalendarDays size={10} className="mr-1" /> {format(new Date(payment.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
                        <span className="flex items-center text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full uppercase font-bold">{payment.payment_method}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {payment.reference && (
                      <Badge variant="outline" className="text-[9px] bg-white text-slate-500 font-mono flex items-center">
                        <FileText size={10} className="mr-1" /> Réf: {payment.reference}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Imprimer le reçu de paiement"
                      onClick={() => setActiveReceipt(payment)}
                    >
                      <Printer size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium italic">Aucun paiement enregistré pour ce client.</p>
            </div>
          )}
        </div>

        {/* ZONE CACHÉE DÉDIÉE À L'IMPRESSION DU REÇU PDF */}
        <div className="hidden">
          {activeReceipt && (
            <div ref={printRef} className="p-16 bg-white text-black font-sans w-[800px]">
              <div className="flex justify-between items-center border-b-2 border-black pb-6 mb-8">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-wide">REÇU DE PAIEMENT</h1>
                  <p className="text-xs text-gray-500 font-mono mt-1">N° REF : {activeReceipt.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-extrabold text-blue-600">BIOPULSE GMAO</h2>
                  <p className="text-[10px] text-gray-400">Suivi des Approvisionnements & Laboratoires</p>
                </div>
              </div>

              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Reçu de la structure :</span>
                    <span className="font-bold text-base text-black">{customer?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Date d'encaissement :</span>
                    <span className="font-medium text-black">{format(new Date(activeReceipt.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
                  </div>
                </div>

                <table className="w-full text-left border-collapse mt-8">
                  <thead>
                    <tr className="border-b-2 border-black bg-gray-100">
                      <th className="py-2 px-3 font-bold uppercase text-xs">Description</th>
                      <th className="py-2 px-3 font-bold uppercase text-xs">Méthode</th>
                      <th className="py-2 px-3 font-bold uppercase text-xs text-right">Montant Versé</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-3 font-medium">
                        Règlement partiel / total de la dette de réactifs
                        {activeReceipt.reference && <span className="block text-xs text-gray-500 mt-0.5">Note : {activeReceipt.reference}</span>}
                      </td>
                      <td className="py-4 px-3 uppercase font-mono text-xs">{activeReceipt.payment_method}</td>
                      <td className="py-4 px-3 font-black text-right text-base">{formatFCFA(activeReceipt.amount)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="pt-16 mt-12 border-t border-gray-200 flex justify-between items-center">
                  <div className="text-center w-40 border-t border-dashed border-gray-400 pt-2">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Cachet / Signature</p>
                  </div>
                  <div className="text-right text-xs text-gray-400 italic">
                    Document généré automatiquement par BioPulse GMAO.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerPaymentHistoryDialog;