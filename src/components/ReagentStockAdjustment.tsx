"use client";

import React, { useState } from "react";
import { Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ReagentStockAdjustmentProps {
  reagentId: string;
  currentStock: number;
  reagentName: string;
  onSuccess: () => void;
}

const ReagentStockAdjustment: React.FC<ReagentStockAdjustmentProps> = ({ 
  reagentId, 
  currentStock, 
  reagentName,
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
      // 1. Mettre à jour le stock
      const { error: updateError } = await supabase
        .from('lab_reagents')
        .update({ current_stock: newStock })
        .eq('id', reagentId);

      if (updateError) throw updateError;

      // 2. Enregistrer le mouvement
      await supabase.from('lab_reagent_movements').insert({
        reagent_id: reagentId,
        user_id: user?.id.includes('fake') ? null : user?.id,
        quantity: qty,
        type: type,
        reason: type === 'IN' ? 'Réapprovisionnement' : 'Utilisation Labo'
      });

      showSuccess(`${type === 'IN' ? 'Ajout' : 'Retrait'} de ${qty} unité(s) effectué.`);
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
        className="w-20 h-9 rounded-xl text-center font-bold"
        min="1"
      />
      <div className="flex gap-1">
        <Button 
          size="sm" 
          variant="outline" 
          className="h-9 px-2 rounded-xl text-red-600 border-red-200 hover:bg-red-50 flex items-center"
          onClick={() => handleAdjust('OUT')}
          disabled={isLoading}
          title="Retrancher du stock"
        >
          {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <><ArrowDownCircle size={16} className="mr-1" /> Sortie</>}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-9 px-2 rounded-xl text-green-600 border-green-200 hover:bg-green-50 flex items-center"
          onClick={() => handleAdjust('IN')}
          disabled={isLoading}
          title="Ajouter au stock"
        >
          {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <><ArrowUpCircle size={16} className="mr-1" /> Entrée</>}
        </Button>
      </div>
    </div>
  );
};

export default ReagentStockAdjustment;