"use client";

import React, { useState, useEffect } from "react";
import { Loader2, ArrowUpCircle, ArrowDownCircle, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'IN' | 'OUT' | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("none");
  const [batchNumber, setBatchNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase.from('reagent_customers').select('id, name, customer_type');
      if (data) setCustomers(data);
    };
    fetchCustomers();
  }, []);

  const handleOpenValidation = (type: 'IN' | 'OUT') => {
    const qty = parseInt(amount);
    if (isNaN(qty) || qty <= 0) return showError("Quantité invalide.");
    if (type === 'OUT' && currentStock < qty) return showError("Stock insuffisant !");
    
    setActionType(type);
    setIsModalOpen(true);
  };

  const handleConfirmMovement = async () => {
    setIsLoading(true);
    const qty = parseInt(amount);

    try {
      // 1. Enregistrement dans la table d'historique
      const { error: moveErr } = await supabase.from('reagent_stock_movements').insert({
        reagent_id: reagentId,
        technician_id: user?.id,
        customer_id: actionType === 'OUT' ? (selectedCustomer !== "none" ? selectedCustomer : null) : null,
        movement_type: actionType,
        quantity: actionType === 'OUT' ? -qty : qty,
        batch_number: batchNumber,
        expiration_date: expirationDate || null,
        reason: reason
      });
      if (moveErr) throw moveErr;

      // 2. Mise à jour du stock dans la table principale
      const newStock = actionType === 'OUT' ? currentStock - qty : currentStock + qty;
      const { error: updateErr } = await supabase
        .from('lab_reagents')
        .update({ current_stock: newStock }) // Vérifie bien que ta colonne s'appelle current_stock
        .eq('id', reagentId);
      
      if (updateErr) throw updateErr;

      showSuccess("Mouvement enregistré avec succès.");
      setIsModalOpen(false);
      onSuccess();
    } catch (err: any) {
      console.error("Erreur Supabase:", err);
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-16 h-9 text-center font-bold text-xs" />
      <div className="flex gap-1">
        <Button size="sm" variant="outline" className="h-9 px-2.5 rounded-xl text-red-600" onClick={() => handleOpenValidation('OUT')}>Sortie</Button>
        <Button size="sm" variant="outline" className="h-9 px-2.5 rounded-xl text-green-600" onClick={() => handleOpenValidation('IN')}>Entrée</Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validation du mouvement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Numéro de lot" onChange={(e) => setBatchNumber(e.target.value)} />
            {actionType === 'OUT' && (
              <Select onValueChange={setSelectedCustomer}>
                <SelectTrigger><SelectValue placeholder="Client" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button onClick={handleConfirmMovement} disabled={isLoading}>Confirmer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReagentStockAdjustment;