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
import { ShoppingBag, Loader2, CalendarDays, ShoppingCart, Printer, PackageSearch } from "lucide-react";

interface Movement {
  id: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  order_id: string | null;
  lab_reagents: {
    name: string;
    purchase_cost: number;
  } | null;
  // Propriétés calculées
  qty: number;
  price: number;
}

interface OrderGroup {
  id: string; // Soit order_id, soit movement_id (pour les anciens articles seuls)
  isGrouped: boolean;
  created_at: string;
  reason: string | null;
  totalAmount: number;
  items: Movement[];
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
  const [orders, setOrders] = useState<OrderGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // === ÉTATS POUR L'IMPRESSION DU BON DE LIVRAISON MULTI-ARTICLES ===
  const printRef = useRef<HTMLDivElement>(null);
  const [activeInvoice, setActiveInvoice] = useState<OrderGroup | null>(null);

  const triggerPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Bon_Livraison_${customer?.name.replace(/\s+/g, '_')}`,
    onAfterPrint: () => setActiveInvoice(null),
  });

  // Déclencher l'impression dès que la structure HTML de la facture est chargée
  useEffect(() => {
    if (activeInvoice) {
      setTimeout(() => {
        triggerPrint();
      }, 150);
    }
  }, [activeInvoice, triggerPrint]);

  useEffect(() => {
    if (isOpen && customer) {
      const fetchPurchases = async () => {
        setIsLoading(true);
        try {
          // On récupère tous les mouvements, y compris la nouvelle colonne order_id
          const { data, error } = await supabase
            .from("reagent_stock_movements")
            .select(`
              id,
              quantity,
              reason,
              created_at,
              order_id,
              lab_reagents (
                name,
                purchase_cost
              )
            `)
            .eq("customer_id", customer.id)
            .order("created_at", { ascending: false });

          if (error) throw error;

          // LOGIQUE DE REGROUPEMENT : On assemble les articles de la même commande (Panier)
          const groupedData = (data || []).reduce((acc: Record<string, OrderGroup>, current: any) => {
            // Si l'article a un order_id (venant du panier), on groupe par order_id. 
            // Sinon (ancienne méthode), on le laisse seul avec son propre id.
            const key = current.order_id || current.id;
            
            if (!acc[key]) {
              acc[key] = {
                id: key,
                isGrouped: !!current.order_id,
                created_at: current.created_at,
                reason: current.reason,
                totalAmount: 0,
                items: []
              };
            }

            const qty = Math.abs(current.quantity);
            const price = current.lab_reagents?.purchase_cost || 0;
            
            acc[key].items.push({ ...current, qty, price });
            acc[key].totalAmount += (qty * price);
            
            return acc;
          }, {});

          // Convertir l'objet en tableau et trier par date la plus récente
          const ordersArray = Object.values(groupedData).sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          setOrders(ordersArray);
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
            <ShoppingBag className="text-indigo-600" size={20} /> Historique des Commandes
          </DialogTitle>
          <DialogDescription>
            Bons de livraison et articles retirés par <strong>{customer?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-indigo-600 h-8 w-8" />
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => {
                // Générer un petit résumé visuel des articles (Ex: "Tubes EDTA, Seringues...")
                const itemNames = order.items.map(i => i.lab_reagents?.name || "Article").join(", ");
                const summary = itemNames.length > 50 ? itemNames.substring(0, 50) + "..." : itemNames;

                return (
                  <div key={order.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between hover:border-indigo-200 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                        {order.isGrouped ? <ShoppingCart size={18} /> : <PackageSearch size={18} />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">
                          {order.isGrouped ? `Commande de ${order.items.length} article(s)` : summary}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1 max-w-[250px]">
                          {order.isGrouped ? summary : `Quantité : ${order.items[0].qty} u.`}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium mt-1.5">
                          <span className="flex items-center"><CalendarDays size={10} className="mr-1" /> {format(new Date(order.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
                          <span className="bg-white border px-1.5 py-0.5 rounded-full font-mono">Réf: {order.id.substring(0,8).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-1 shrink-0">
                      <div className="mb-1 text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                        <span className="font-black text-slate-900 text-sm">{formatFCFA(order.totalAmount)}</span>
                      </div>
                      
                      {/* BOUTON IMPRIMER LA FACTURE DE LA COMMANDE COMPLÈTE */}
                      <button
                        onClick={() => setActiveInvoice(order)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-md flex items-center gap-1 text-[10px] font-bold uppercase"
                        title="Imprimer le Bon de Livraison"
                      >
                        <Printer size={12} /> Imprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium italic">Aucune commande tracée pour cette structure.</p>
            </div>
          )}
        </div>

        {/* ===== ZONE CACHÉE DÉDIÉE À L'IMPRESSION DU BON DE LIVRAISON MULTI-ARTICLES ===== */}
        <div className="hidden">
          {activeInvoice && (
            <div ref={printRef} className="p-16 bg-white text-black font-sans w-[800px]">
              {/* Header Facture */}
              <div className="flex justify-between items-center border-b-2 border-black pb-6 mb-8">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-wide">BON DE LIVRAISON</h1>
                  <p className="text-xs text-gray-500 font-mono mt-1">N° COMMANDE : {activeInvoice.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-extrabold text-indigo-600">BIOPULSE GMAO</h2>
                  <p className="text-[10px] text-gray-400">Département Logistique & Réactifs</p>
                </div>
              </div>

              {/* Contenu Facture */}
              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Client / Structure :</span>
                    <span className="font-bold text-base text-black">{customer?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Date d'édition :</span>
                    <span className="font-medium text-black">{format(new Date(activeInvoice.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
                  </div>
                </div>

                {/* TABLEAU DES ARTICLES DU PANIER */}
                <table className="w-full text-left border-collapse mt-8">
                  <thead>
                    <tr className="border-b-2 border-black bg-gray-100">
                      <th className="py-2 px-3 font-bold uppercase text-xs">Description de l'Article</th>
                      <th className="py-2 px-3 font-bold uppercase text-xs text-center">Qté</th>
                      <th className="py-2 px-3 font-bold uppercase text-xs text-right">P.U.</th>
                      <th className="py-2 px-3 font-bold uppercase text-xs text-right">Montant Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeInvoice.items.map((item, index) => {
                      const lineTotal = item.qty * item.price;
                      return (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="py-4 px-3 font-medium">
                            {item.lab_reagents?.name || "Article Inconnu"}
                            {!activeInvoice.isGrouped && item.reason && (
                              <span className="block text-xs text-gray-500 mt-0.5">Motif : {item.reason}</span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-center font-bold text-indigo-600">{item.qty}</td>
                          <td className="py-4 px-3 text-right text-gray-600">{formatFCFA(item.price)}</td>
                          <td className="py-4 px-3 font-black text-right text-base">{formatFCFA(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Ligne du Total Général */}
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="py-4 px-3 text-right font-bold uppercase text-xs">Total de la Commande :</td>
                      <td className="py-4 px-3 text-right font-black text-xl text-black border-t-2 border-black">
                        {formatFCFA(activeInvoice.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Pied de page Facture */}
                <div className="pt-24 mt-12 border-t border-gray-200 flex justify-between items-end">
                  <div className="text-center w-48 border-t border-dashed border-gray-400 pt-2">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Signature Client & Cachet</p>
                  </div>
                  <div className="text-center w-48 border-t border-dashed border-gray-400 pt-2">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Visa BioPulse</p>
                  </div>
                </div>
                <div className="mt-8 text-center text-[9px] text-gray-400 uppercase tracking-widest">
                  Les marchandises livrées restent notre propriété jusqu'au paiement intégral.
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerPurchaseHistoryDialog;