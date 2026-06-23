"use client";

import React, { useState, useEffect } from "react";
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
import { History, Loader2, Banknote, CalendarDays, FileText } from "lucide-center";
import { Badge } from "@/components/ui/badge";

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
                <div key={payment.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between hover:border-blue-200 transition-colors">
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
                  {payment.reference && (
                    <Badge variant="outline" className="text-[9px] bg-white text-slate-500 font-mono flex items-center">
                      <FileText size={10} className="mr-1" /> Réf: {payment.reference}
                    </Badge>
                  )}
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
      </DialogContent>
    </Dialog>
  );
};

export default CustomerPaymentHistoryDialog;