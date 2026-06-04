"use client";

import React, { useState } from "react";
import { Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PartStockAdjustmentProps {
  partId: string;
  currentStock: number;
  partName: string;
  onSuccess: () => void;
}

const PartStockAdjustment: React.FC<PartStockAdjustmentProps> = ({ 
  partId, 
  currentStock, 
  partName,
  onSuccess 
}) => {
  const [amount, setAmount] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleAdjust = async (type: 'IN' | 'OUT') => {
    const qty = parseInt(amount);
    if (isNaN(qty) || qty <= 0) {
      showError("Veuillez saisir une quantité valide.");
      return;
    }
    
    if (type === 'OUT' && currentStock < qty) {
      showError("Stock insuffisant pour cette sortie !");
      return;
    }

    setIsLoading(true);
    const newStock = type === 'IN' ? currentStock + qty : currentStock - qty;

    try {
      // 1. Mettre à jour le stock de la pièce
      const { error: updateError } = await supabase
        .from('spare_parts')
        .update({ current_stock: newStock })
        .eq('id', partId);

      if (updateError) throw updateError;

      // 2. Enregistrer le mouvement de stock
      await supabase.from('spare_part_movements').insert({
        part_id: partId,
        user_id: user?.id,
        quantity: qty,
        type: type,
        reason: type === 'IN' ? 'Approvisionnement' : 'Utilisation Maintenance'
      });

      showSuccess(`${type === 'IN' ? 'Entrée' : 'Sortie'} de ${qty} unité(s) effectuée avec succès.`);
      setAmount("1");
      onSuccess();
    } catch (error: any) {
      showError(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        className="w-16 h-8 rounded-xl text-center font-bold text-xs"
        min="1"
      />
      <div className="flex gap-1">
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 px-2 rounded-xl text-red-600 border-red-200 hover:bg-red-50 flex items-center text-xs font-semibold"
          onClick={() => handleAdjust('OUT')}
          disabled={isLoading}
          title="Retrait / Utilisation"
        >
          {isLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <><ArrowDownCircle size={12} className="mr-1" /> Sortie</>}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 px-2 rounded-xl text-green-600 border-green-200 hover:bg-green-50 flex items-center text-xs font-semibold"
          onClick={() => handleAdjust('IN')}
          disabled={isLoading}
          title="Entrée en stock"
        >
          {isLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <><ArrowUpCircle size={12} className="mr-1" /> Entrée</>}
        </Button>
      </div>
    </div>
  );
};

export default PartStockAdjustment;