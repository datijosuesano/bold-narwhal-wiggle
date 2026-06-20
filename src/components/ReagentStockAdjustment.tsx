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
  
  // États de base
  const [amount, setAmount] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'IN' | 'OUT' | null>(null);
  
  // États des données relationnelles
  const [customers, setCustomers] = useState<any[]>([]);
  
  // États du formulaire de mouvement
  const [selectedCustomer, setSelectedCustomer] = useState<string>("none");
  const [batchNumber, setBatchNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [reason, setReason] = useState("");

  // Récupérer la liste des clients commerciaux au montage
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('reagent_customers')
        .select('id, name, customer_type')
        .order('name');
      
      if (!error && data) {
        setCustomers(data);
      }
    };
    fetchCustomers();
  }, []);

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
    // Pré-remplir la raison selon le type d'action
    setReason(type === 'OUT' ? "Vente à un client" : "Réception de commande fournisseur");
    setBatchNumber("");
    setExpirationDate("");
    setSelectedCustomer("none");
    setIsModalOpen(true);
  };

  const handleConfirmMovement = async () => {
    const qty = parseInt(amount);

    // Validations obligatoires
    if (!batchNumber) {
      showError("Le numéro de lot (Batch) est obligatoire pour la traçabilité.");
      return;
    }

    if (actionType === 'OUT' && selectedCustomer === "none") {
      showError("Veuillez sélectionner le client acheteur pour cette sortie.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Insérer la trace dans l'historique des mouvements
      const { error: movementError } = await supabase
        .from('reagent_stock_movements')
        .insert({
          reagent_id: reagentId,
          technician_id: user?.id,
          customer_id: actionType === 'OUT' ? selectedCustomer : null, // On lie le client si c'est une vente
          movement_type: actionType,
          quantity: actionType === 'OUT' ? -qty : qty, // Négatif si sortie
          batch_number: batchNumber,
          expiration_date: expirationDate || null,
          reason: reason
        });

      if (movementError) throw movementError;

      // 2. Mettre à jour la quantité globale du réactif
      const newStock = actionType === 'OUT' ? currentStock - qty : currentStock + qty;
      const { error: updateError } = await supabase
        .from('lab_reagents')
        .update({ quantity: newStock })
        .eq('id', reagentId);

      if (updateError) throw updateError;

      showSuccess(
        `Traçabilité : ${actionType === "IN" ? "Entrée" : "Sortie"} de ${qty} unité(s) enregistrée avec succès.`
      );

      setIsModalOpen(false);
      setAmount("1");
      onSuccess(); // Rafraîchit la liste de la page principale

    } catch (error: any) {
      console.error(error);
      showError(error.message || "Erreur lors de l'enregistrement du mouvement");
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
          title="Vendre / Sortir du Stock"
        >
          {isLoading && actionType === 'OUT' ? <Loader2 className="animate-spin h-3 w-3" /> : <><ArrowDownCircle size={14} className="mr-1" /> Sortie</>}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-9 px-2.5 rounded-xl text-green-600 border-green-200 hover:bg-green-50 flex items-center text-xs font-bold"
          onClick={() => handleOpenValidation('IN')}
          disabled={isLoading}
          title="Réceptionner / Ajouter au Stock"
        >
          {isLoading && actionType === 'IN' ? <Loader2 className="animate-spin h-3 w-3" /> : <><ArrowUpCircle size={14} className="mr-1" /> Entrée</>}
        </Button>
      </div>

      {/* DIALOG DE MOUVEMENT DE STOCK */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase text-slate-900 tracking-tight flex items-center">
              {actionType === 'OUT' ? (
                <><ShoppingCart className="mr-2 h-5 w-5 text-red-600" /> Sortie / Vente</>
              ) : (
                <><Package className="mr-2 h-5 w-5 text-green-600" /> Réception Stock</>
              )}
            </DialogTitle>
            <DialogDescription>
              Enregistrement d'un mouvement pour <strong className="text-slate-800">{reagentName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className={`p-3 rounded-xl border space-y-1 ${actionType === 'OUT' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'}`}>
              <p className="text-xs font-medium">Quantité à traiter : <strong className="text-slate-900 text-sm">{amount} unité(s)</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">N° de Lot (Batch) <span className="text-red-500">*</span></Label>
                <Input 
                  value={batchNumber} 
                  onChange={(e) => setBatchNumber(e.target.value)} 
                  placeholder="Ex: L-2026X"
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Péremption (Optionnel)</Label>
                <Input 
                  type="date"
                  value={expirationDate} 
                  onChange={(e) => setExpirationDate(e.target.value)} 
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            {/* Le champ Client n'apparaît que si c'est une sortie (Vente) */}
            {actionType === 'OUT' && (
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Client Acheteur <span className="text-red-500">*</span></Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue placeholder="Sélectionnez un client..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none" disabled>Sélectionnez un client...</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.customer_type === 'revendeur' ? '(Revendeur)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-500">Motif / Raison</Label>
              <Input 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl">Annuler</Button>
            <Button onClick={handleConfirmMovement} disabled={isLoading} className={`rounded-xl text-white font-bold ${actionType === 'OUT' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
              {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Confirmer {actionType === 'OUT' ? 'la sortie' : "l'entrée"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReagentStockAdjustment;