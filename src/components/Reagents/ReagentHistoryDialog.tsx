"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowUpRight, ArrowDownRight, Loader2, Clock, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Movement {
  id: string;
  quantity: number;
  movement_type: 'IN' | 'OUT' | 'ADJUST';
  reason: string;
  created_at: string;
  reagent_customers: {
    name: string;
  } | null;
}

interface ReagentHistoryDialogProps {
  reagentId: string | null;
  reagentName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const ReagentHistoryDialog: React.FC<ReagentHistoryDialogProps> = ({ reagentId, reagentName, isOpen, onClose }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && reagentId) {
      const fetchHistory = async () => {
        setIsLoading(true);
        // On interroge la bonne table et on joint le nom du client s'il y en a un !
        const { data, error } = await supabase
          .from('reagent_stock_movements')
          .select(`
            id,
            quantity,
            movement_type,
            reason,
            created_at,
            reagent_customers ( name )
          `)
          .eq('reagent_id', reagentId)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Erreur de chargement de l'historique:", error);
        }

        setMovements((data as any) || []);
        setIsLoading(false);
      };
      fetchHistory();
    }
  }, [isOpen, reagentId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <Clock className="mr-2 text-blue-600" /> Historique : {reagentName}
          </DialogTitle>
          <DialogDescription>Derniers mouvements de stock enregistrés.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
          ) : movements.length > 0 ? (
            movements.map((m) => {
              const isOut = m.movement_type === 'OUT';
              const qty = Math.abs(m.quantity);
              const customerName = m.reagent_customers?.name;

              return (
                <div key={m.id} className="p-3 border rounded-xl bg-card flex items-center justify-between hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      !isOut ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    )}>
                      {!isOut ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">
                        {!isOut ? '+' : '-'}{qty} unité(s)
                      </p>
                      
                      {/* Affichage du motif de base */}
                      {m.reason && (
                        <p className="text-[10px] text-slate-500 uppercase">{m.reason}</p>
                      )}

                      {/* Affichage du nom du client si le réactif a été vendu/livré */}
                      {customerName && (
                        <p className="text-[10px] font-bold text-indigo-600 flex items-center mt-0.5 bg-indigo-50 px-1.5 py-0.5 rounded-md inline-flex">
                          <Building2 size={10} className="mr-1" /> Livré à : {customerName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-slate-700">{format(new Date(m.created_at), 'dd/MM/yyyy', { locale: fr })}</p>
                    <p className="text-[10px] text-slate-400">{format(new Date(m.created_at), 'HH:mm')}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-400 italic border-2 border-dashed rounded-xl">
              Aucun mouvement enregistré pour ce réactif.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReagentHistoryDialog;