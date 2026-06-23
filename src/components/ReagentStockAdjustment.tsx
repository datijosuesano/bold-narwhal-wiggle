"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Scale, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";

interface ReagentStockAdjustmentProps {
  reagentId: string;
  currentStock: number;
  reagentName: string;
  onSuccess: () => void;
}

interface Customer {
  id: string;
  name: string;
  current_debt: number;
  credit_limit: number;
  customer_type: string;
}

const ReagentStockAdjustment: React.FC<ReagentStockAdjustmentProps> = ({
  reagentId,
  currentStock,
  reagentName,
  onSuccess,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // États du mouvement de stock
  const [movementType, setMovementType] = useState<"IN" | "OUT">("OUT");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [purchaseCost, setPurchaseCost] = useState<number>(0);

  // États pour la liaison client & recouvrement
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isCreditPurchase, setIsCreditPurchase] = useState(false);

  // Charger les clients actifs et le coût unitaire du réactif au moment de l'ouverture
  useEffect(() => {
    if (isOpen) {
      const loadAdjustmentData = async () => {
        try {
          // 1. Récupérer le prix du réactif
          const { data: reagentData } = await supabase
            .from("lab_reagents")
            .select("purchase_cost")
            .eq("id", reagentId)
            .single();
          
          if (reagentData?.purchase_cost) {
            setPurchaseCost(reagentData.purchase_cost);
          }

          // 2. Récupérer les clients actifs pour la liste déroulante
          const { data: customersData, error } = await supabase
            .from("reagent_customers")
            .select("id, name, current_debt, credit_limit, customer_type")
            .eq("is_active", true)
            .order("name");

          if (error) throw error;
          setCustomers(customersData || []);
        } catch (err) {
          console.error("Erreur de chargement des données d'ajustement:", err);
        }
      };

      loadAdjustmentData();
      // Reset des états internes
      setQuantity("");
      setReason("");
      setSelectedCustomerId("");
      setIsCreditPurchase(false);
      setMovementType("OUT");
    }
  }, [isOpen, reagentId]);

  // Trouver les informations du client sélectionné pour afficher des alertes dynamiques
  const currentSelectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const transactionTotal = (Number(quantity) || 0) * purchaseCost;
  
  const wouldExceedLimit = currentSelectedCustomer 
    ? currentSelectedCustomer.credit_limit > 0 && (currentSelectedCustomer.current_debt + transactionTotal > currentSelectedCustomer.credit_limit)
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const qtyNumber = Number(quantity);
    if (!qtyNumber || qtyNumber <= 0) {
      showError("Veuillez saisir une quantité valide supérieure à 0.");
      return;
    }

    if (movementType === "OUT" && qtyNumber > currentStock) {
      showError(`Stock insuffisant. Stock disponible : ${currentStock}`);
      return;
    }

    if (movementType === "OUT" && isCreditPurchase && !selectedCustomerId) {
      showError("Veuillez sélectionner un client pour un achat à crédit.");
      return;
    }

    try {
      setIsLoading(true);

      // Déterminer la valeur finale de la quantité (négative si sortie)
      const finalQuantity = movementType === "IN" ? qtyNumber : -qtyNumber;
      const newStockValue = currentStock + finalQuantity;

      // 1. Enregistrer le mouvement dans reagent_stock_movements
      const { error: movementError } = await supabase
        .from("reagent_stock_movements")
        .insert({
          reagent_id: reagentId,
          movement_type: movementType,
          quantity: finalQuantity,
          reason: reason || (movementType === "IN" ? "Réapprovisionnement" : "Consommation / Vente"),
        });

      if (movementError) throw movementError;

      // 2. Mettre à jour le stock actuel dans lab_reagents
      const { error: reagentUpdateError } = await supabase
        .from("lab_reagents")
        .update({ current_stock: newStockValue })
        .eq("id", reagentId);

      if (reagentUpdateError) throw reagentUpdateError;

      // 3. SI SORTIE À CRÉDIT : Mettre à jour la dette du client (current_debt)
      if (movementType === "OUT" && isCreditPurchase && selectedCustomerId) {
        const newDebt = (currentSelectedCustomer?.current_debt || 0) + transactionTotal;

        const { error: customerUpdateError } = await supabase
          .from("reagent_customers")
          .update({ current_debt: newDebt })
          .eq("id", selectedCustomerId);

        if (customerUpdateError) throw customerUpdateError;
      }

      showSuccess("Le stock a été ajusté avec succès.");
      onSuccess();
      setIsOpen(false);
    } catch (err: any) {
      console.error("Erreur lors de l'ajustement du stock:", err);
      showError(`Erreur système : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50">
          <Scale size={14} className="mr-1.5 text-blue-600" /> Ajuster Stock
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">
            Ajustement : {reagentName}
          </DialogTitle>
          <DialogDescription>
            Modifier le niveau de stock. Le stock actuel disponible est de <strong className="text-blue-600">{currentStock}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Type de mouvement (Entrée / Sortie) */}
          <div className="space-y-2">
            <Label>Type d'opération</Label>
            <Select
              value={movementType}
              onValueChange={(val: "IN" | "OUT") => {
                setMovementType(val);
                if (val === "IN") setIsCreditPurchase(false);
              }}
            >
              <SelectTrigger className="rounded-xl font-semibold">
                <SelectValue placeholder="Choisir l'opération" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="OUT" className="font-medium text-red-600">🔽 Sortie de stock (Utilisation / Vente)</SelectItem>
                <SelectItem value="IN" className="font-medium text-green-600">🔼 Entrée de stock (Approvisionnement)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantité */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité à ajuster</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Ex: 5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                className="rounded-xl font-bold"
                required
              />
            </div>

            {/* Motif / Commentaire */}
            <div className="space-y-2">
              <Label htmlFor="reason">Motif ou Commentaire</Label>
              <Input
                id="reason"
                placeholder="Ex: Vente Urgente, Périmé..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* ===== SECTION SUIVI CLIENT & CRÉDIT (Visible uniquement sur les sorties) ===== */}
          {movementType === "OUT" && (
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold uppercase text-indigo-900 block">Associer à un Client</Label>
                  <span className="text-[10px] text-slate-500">Imputer la sortie à une structure</span>
                </div>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="w-52 rounded-xl bg-white border-indigo-200 text-xs">
                    <SelectValue placeholder="Sélectionner le client" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-xs">
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name} <span className="text-[10px] text-slate-400">({c.customer_type})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomerId && (
                <>
                  <div className="flex items-center justify-between pt-2 border-t border-indigo-100">
                    <div>
                      <Label htmlFor="credit-toggle" className="text-xs font-bold text-slate-700 block">Achat à crédit / Facturation ultérieure</Label>
                      <span className="text-[10px] text-slate-500">Ajouter le coût de {transactionTotal.toLocaleString()} FCFA à la dette</span>
                    </div>
                    <Switch
                      id="credit-toggle"
                      checked={isCreditPurchase}
                      onCheckedChange={setIsCreditPurchase}
                    />
                  </div>

                  {/* Alerte si le client dépasse son plafond de crédit autorisé */}
                  {isCreditPurchase && wouldExceedLimit && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2 animate-pulse">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Alerte Plafond :</span> Ce client va dépasser sa limite de crédit autorisée (Max: {currentSelectedCustomer?.credit_limit.toLocaleString()} FCFA).
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading} className="rounded-xl">
              Annuler
            </Button>
            <Button 
              type="submit" 
              className={cn("rounded-xl font-bold text-white shadow-md", movementType === "IN" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700")}
              disabled={isLoading || (isCreditPurchase && wouldExceedLimit)} // Bloque la validation si la limite de crédit est enfoncée !
            >
              {isLoading ? (
                <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Traitement...</>
              ) : (
                movementType === "IN" ? "Valider l'Entrée" : "Valider la Sortie"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReagentStockAdjustment;