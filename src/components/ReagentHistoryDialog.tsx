"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowUpRight, ArrowDownRight, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Movement {
  id: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'ADJUST';
  reason: string;
  created_at: string;
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
        const { data } = await supabase
          .from('lab_reagent_movements')
          .select('*')
          .eq('reagent_id', reagentId)
          .order('created_at', { ascending: false });
        
        setMovements(data || []);
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

        <div className="mt-4 max-h-[400px] overflow-y-auto pr-2 space-y-3">
          {isLoading ? (
            <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
          ) : movements.length > 0 ? (
            movements.map((m) => (
              <div key={m.id} className="p-3 border rounded-xl bg-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    m.type === 'IN' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  )}>
                    {m.type === 'IN' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">
                      {m.type === 'IN' ? '+' : '-'}{m.quantity} unité(s)
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">{m.reason || 'Mouvement stock'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-medium">{format(new Date(m.created_at), 'dd/MM/yyyy', { locale: fr })}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), 'HH:mm')}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground italic border-2 border-dashed rounded-xl">
              Aucun mouvement enregistré pour ce réactif.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReagentHistoryDialog;