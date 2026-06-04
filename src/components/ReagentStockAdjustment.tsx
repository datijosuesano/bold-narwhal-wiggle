"use client";

import React, { useState } from "react";
import { Loader2, ArrowUpCircle, ArrowDownCircle, ShieldCheck, AlertTriangle } from "lucide-react";
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
  const [amount, setAmount] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);
  const [isDoubleAuthOpen, setIsDoubleAuthOpen] = useState(false);
  const [actionType, setActionType] = useState<'IN' | 'OUT' | null>(null);
  const [reason, setReason] = useState("Utilisation Labo");
  const [supervisorConfirm, setSupervisorConfirm] = useState(false);
  const { user } = useAuth();

  const handleOpenValidation = (type: 'IN' | 'OUT') => {
    const qty = parseInt(amount);
    if (isNaN(qty) || qty <= 0) {
      showError("Veuillez saisir une quantité valide.");
      return;
    }
    
    if (type === 'OUT' && currentStock < qty) {
      showError("Stock insuffisant pour cette sortie !");
      return;
    }

    setActionType(type);
    if (type === 'OUT') {
      // Forcer la double validation de sécurité ISO pour les sorties
      setIsDoubleAuthOpen(true);
      setSupervisorConfirm(false);
    } else {
      // Entrée simple
      executeAdjustment(type, qty, "Réapprovisionnement");
    }
  };

  const handleDoubleAuthSubmit = () => {
    const qty = parseInt(amount);
    if (!supervisorConfirm) {
      showError("Veuillez cocher la case de confirmation de conformité ISO.");
      return;
    }
    setIsDoubleAuthOpen(false);
    if (actionType) {
      executeAdjustment(actionType, qty, reason);
    }
  };

  const executeAdjustment = async (type: 'IN' | 'OUT', qty: number, finalReason: string) => {
    setIsLoading(true);
    const newStock = type === 'IN' ? currentStock + qty : currentStock - qty;

    try {
      // 1. Mettre à jour le stock
      const { error: updateError } = await supabase
        .from('lab_reagents')
        .update({ current_stock: newStock })
        .eq('id', reagentId);

      if (updateError) throw updateError;

      // 2. Enregistrer le mouvement de stock pour l'audit log ISO
      const { error: movementError } = await supabase.from('lab_reagent_movements').insert({
        reagent_id: reagentId,
        user_id: user?.id,
        quantity: qty,
        type: type,
        reason: finalReason
      });

      if (movementError) throw movementError;

      showSuccess(`Audit ISO : ${type === 'IN' ? 'Entrée' : 'Sortie'} de ${qty} unité(s) enregistrée.`);
      setAmount("1");
      onSuccess();
    } catch (error: any) {
      showError(`Erreur : ${error.message}`);
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
        className="w-16 h-9 rounded-xl text-center font-bold text-xs"
        min="1"
      />
      <div className="flex gap-1">
        <Button 
          size="sm" 
          variant="outline" 
          className="h-9 px-2.5 rounded-xl text-red-600 border-red-200 hover:bg-red-50 flex items-center text-xs font-bold"
          onClick={() => handleOpenValidation('OUT')}
          disabled={isLoading}
          title="Retrait / Sortie de Stock"
        >
          {isLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <><ArrowDownCircle size={14} className="mr-1" /> Sortie</>}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-9 px-2.5 rounded-xl text-green-600 border-green-200 hover:bg-green-50 flex items-center text-xs font-bold"
          onClick={() => handleOpenValidation('IN')}
          disabled={isLoading}
          title="Ajout de Stock"
        >
          {isLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <><ArrowUpCircle size={14} className="mr-1" /> Entrée</>}
        </Button>
      </div>

      {/* DOUBLE VALIDATION DIALOG (SÉCURITÉ ISO 9001) */}
      <Dialog open={isDoubleAuthOpen} onOpenChange={setIsDoubleAuthOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase text-slate-900 tracking-tight flex items-center">
              <ShieldCheck className="mr-2 text-blue-600" /> Double Validation ISO
            </DialogTitle>
            <DialogDescription>
              Une double validation est requise pour toute sortie de réactif biologique de la base BioPulse.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 space-y-1">
              <p className="text-xs font-bold">Réactif : {reagentName}</p>
              <p className="text-xs font-medium">Quantité demandée : <strong className="text-slate-900">{amount} unité(s)</strong></p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-500">Motif de la sortie stock</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="rounded-xl h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Utilisation Labo">Utilisation Labo (Analyse standard)</SelectItem>
                  <SelectItem value="Contrôle Qualité">Contrôle Qualité (CQ)</SelectItem>
                  <SelectItem value="Calibration Appareil">Calibration Appareil</SelectItem>
                  <SelectItem value="Ajustement Inventaire">Ajustement Inventaire / Perte</SelectItem>
                  <SelectItem value="Péremption">Mise au rebut (Périmé)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2.5 p-3 border rounded-xl bg-slate-50/50">
              <input 
                type="checkbox" 
                id="iso-confirm" 
                checked={supervisorConfirm} 
                onChange={(e) => setSupervisorConfirm(e.target.checked)} 
                className="mt-1 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="iso-confirm" className="text-[11px] text-slate-600 leading-tight cursor-pointer">
                Je confirme que cette sortie de stock est autorisée par le biologiste responsable et conforme à la norme de traçabilité ISO.
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsDoubleAuthOpen(false)} className="rounded-xl">Annuler</Button>
            <Button onClick={handleDoubleAuthSubmit} className="rounded-xl bg-blue-600 text-white font-bold">
              Confirmer la sortie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReagentStockAdjustment;