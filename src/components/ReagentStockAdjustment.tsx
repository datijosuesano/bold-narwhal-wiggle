"use client";

import React, { useState } from "react";
import { Loader2, Plus, Minus, Check } from "lucide-react";
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
  const [amount, setAmount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleAdjust = async (type: 'IN' | 'OUT') => {
    if (amount <= 0) return;
    if (type === 'OUT' && currentStock < amount) {
      showError("Stock insuffisant !");
      return;
    }

    setIsLoading(true);
    const newStock = type === 'IN' ? currentStock + amount : currentStock - amount;

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
        quantity: amount,
        type: type,
        reason: type === 'IN' ? 'Réapprovisionnement' : 'Utilisation Laboratoire'
      });

      showSuccess(`${type === 'IN' ? 'Entrée' : 'Sortie'} de ${amount} unité(s) pour ${reagentName}`);
      setAmount(1);
      onSuccess();
    } catch (error: any) {
      showError(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 bg-muted/30 p-1 rounded-xl border">
      <Input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
        className="w-16 h-8 border-none bg-transparent text-center font-bold focus:ring-0"
      />
      <div className="flex gap-1">
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 w-8 rounded-lg text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => handleAdjust('OUT')}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <Minus size={14} />}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 w-8 rounded-lg text-green-600 border-green-200 hover:bg-green-50"
          onClick={() => handleAdjust('IN')}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <Plus size={14} />}
        </Button>
      </div>
    </div>
  );
};

export default ReagentStockAdjustment;