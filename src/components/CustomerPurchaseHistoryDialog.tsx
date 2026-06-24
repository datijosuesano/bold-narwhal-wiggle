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
import { ShoppingBag, Loader2, CalendarDays, FlaskConical } from "lucide-react";

interface PurchaseHistory {
  id: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  lab_reagents: {
    name: string;
    purchase_cost: number;
  } | null;
}

interface CustomerPurchaseHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: { id: string; name: string } | null;
}

const CustomerPurchaseHistoryDialog: React.FC<CustomerPurchaseHistoryDialogProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const [purchases, setPurchases] = useState<PurchaseHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      const fetchPurchases = async () => {
        setIsLoading(true);
        try {
          // Jointure PostgREST pour récupérer les infos du réactif associé
          const { data, error } = await supabase
            .from("reagent_stock_movements")
            .select(`
              id,
              quantity,
              reason,
              created_at,
              lab_reagents (
                name,
                purchase_cost
              )
            `)
            .eq("customer_id", customer.id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          setPurchases((data as any) || []);
        } catch (err) {
          console.error("Erreur chargement historique achats:", err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPurchases();
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
            <ShoppingBag className="text-indigo-600" size={20} /> Historique des Articles Livrés
          </DialogTitle>
          <DialogDescription>
            Suivi des réactifs et consommables retirés par <strong>{customer?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-indigo-600 h-8 w-8" />
            </div>
          ) : purchases.length > 0 ? (
            <div className="space-y-3">
              {purchases.map((purchase) => {
                // Le stock OUT étant enregistré en négatif dans ce flux, on prend la valeur absolue
                const qty = Math.abs(purchase.quantity);
                const unitPrice = purchase.lab_reagents?.purchase_cost || 0;
                const total = qty * unitPrice;

                return (
                  <div key={purchase.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between hover:border-indigo-200 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                        <FlaskConical size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">
                          {purchase.lab_reagents?.name || "Réactif inconnu"}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          Quantité : <span className="font-bold text-slate-700">{qty} u.</span> × {formatFCFA(unitPrice)}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium mt-1">
                          <span className="flex items-center"><CalendarDays size={10} className="mr-1" /> {format(new Date(purchase.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
                          {purchase.reason && <span className="italic">• {purchase.reason}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                      <span className="font-black text-slate-900 text-sm">{formatFCFA(total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium italic">Aucun réactif tracé ou vendu à cette structure.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerPurchaseHistoryDialog;