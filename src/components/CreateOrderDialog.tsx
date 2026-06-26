"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { ShoppingBag, Plus, Trash2, Loader2, AlertTriangle, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface CreateOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Customer {
  id: string;
  name: string;
  current_debt: number;
  credit_limit: number;
  customer_type: string;
}

interface Reagent {
  id: string;
  name: string;
  current_stock: number;
  purchase_cost: number;
}

interface CartItem {
  reagentId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const CreateOrderDialog: React.FC<CreateOrderDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Données de sélection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reagents, setReagents] = useState<Reagent[]>([]);

  // Formulaire principal
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isCreditPurchase, setIsCreditPurchase] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Formulaire d'ajout d'un article au panier
  const [currentReagentId, setCurrentReagentId] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState<number | "">("");

  // Charger les listes au démarrage
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const { data: custData } = await supabase.from("reagent_customers").select("*").eq("is_active", true).order("name");
          const { data: reagData } = await supabase.from("lab_reagents").select("*").order("name");
          
          setCustomers(custData || []);
          setReagents(reagData || []);
        } catch (err) {
          console.error("Erreur de chargement du panier:", err);
        }
      };
      loadData();
      // Reset
      setCart([]);
      setSelectedCustomerId("");
      setIsCreditPurchase(false);
      setCurrentReagentId("");
      setCurrentQuantity("");
    }
  }, [isOpen]);

  const currentCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedReagent = reagents.find(r => r.id === currentReagentId);
  
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const wouldExceedLimit = currentCustomer 
    ? currentCustomer.credit_limit > 0 && (currentCustomer.current_debt + cartTotal > currentCustomer.credit_limit)
    : false;

  // Ajouter un article au panier temporaire
  const handleAddItem = () => {
    const qty = Number(currentQuantity);
    if (!selectedReagent || !qty || qty <= 0) {
      showError("Sélectionnez un réactif et une quantité valide.");
      return;
    }

    if (qty > selectedReagent.current_stock) {
      showError(`Stock insuffisant. Quantité disponible : ${selectedReagent.current_stock}`);
      return;
    }

    // Vérifier si l'article est déjà dans le panier
    const existingIndex = cart.findIndex(item => item.reagentId === selectedReagent.id);
    if (existingIndex > -1) {
      const newQty = cart[existingIndex].quantity + qty;
      if (newQty > selectedReagent.current_stock) {
        showError(`Le panier total dépasse le stock disponible (${selectedReagent.current_stock}).`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity = newQty;
      updatedCart[existingIndex].totalPrice = newQty * selectedReagent.purchase_cost;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        reagentId: selectedReagent.id,
        name: selectedReagent.name,
        quantity: qty,
        unitPrice: selectedReagent.purchase_cost,
        totalPrice: qty * selectedReagent.purchase_cost
      }]);
    }

    setCurrentReagentId("");
    setCurrentQuantity("");
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + " FCFA";
  };

  // Validation finale du bon de commande complet
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      showError("Veuillez sélectionner un client.");
      return;
    }
    if (cart.length === 0) {
      showError("Votre panier est vide.");
      return;
    }

    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Enregistrer la commande parente dans reagent_orders
      const { data: orderData, error: orderError } = await supabase
        .from("reagent_orders")
        .insert({
          customer_id: selectedCustomerId,
          total_amount: cartTotal,
          is_credit: isCreditPurchase,
          created_by: user?.id
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Traiter chaque article du panier
      for (const item of cart) {
        // Enregistrer le mouvement de stock lié à la commande
        const { error: moveError } = await supabase
          .from("reagent_stock_movements")
          .insert({
            reagent_id: item.reagentId,
            movement_type: "OUT",
            quantity: -item.quantity,
            reason: `Vente Commande N°${orderData.id.substring(0, 8).toUpperCase()}`,
            customer_id: selectedCustomerId,
            order_id: orderData.id // Association établie !
          });

        if (moveError) throw moveError;

        // Mettre à jour le stock physique du réactif
        const databaseReagent = reagents.find(r => r.id === item.reagentId);
        if (databaseReagent) {
          const newStock = databaseReagent.current_stock - item.quantity;
          await supabase.from("lab_reagents").update({ current_stock: newStock }).eq("id", item.reagentId);
        }
      }

      // 3. Imputer la dette globale si achat à crédit
      if (isCreditPurchase && currentCustomer) {
        const newDebt = currentCustomer.current_debt + cartTotal;
        await supabase.from("reagent_customers").update({ current_debt: newDebt }).eq("id", selectedCustomerId);
      }

      showSuccess("Bon de livraison et commande enregistrés avec succès.");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erreur commande:", err);
      showError(`Erreur : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl rounded-2xl bg-white max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-3 shrink-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <ShoppingCart className="text-indigo-600" size={24} /> Nouvelle Sortie Groupée (Panier)
          </DialogTitle>
          <DialogDescription>
            Enregistrez une livraison contenant plusieurs types de réactifs d'un seul coup.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-3 space-y-4 custom-scrollbar">
          {/* Sélection du client */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border">
            <div className="space-y-1.5">
              <Label className="font-bold text-xs uppercase text-slate-500">Sélectionner la Structure</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="rounded-xl bg-white">
                  <SelectValue placeholder="Choisir le client..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.customer_type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomerId && (
              <div className="flex items-center justify-between pt-4 pl-2">
                <div className="space-y-0.5">
                  <Label htmlFor="credit-order" className="font-bold text-xs text-slate-700 block">Facturer à Crédit</Label>
                  <span className="text-[10px] text-slate-400">Ajouter le total à son compte</span>
                </div>
                <Switch id="credit-order" checked={isCreditPurchase} onCheckedChange={setIsCreditPurchase} />
              </div>
            )}
          </div>

          {/* AJOUTER UN ARTICLE AU PANIER */}
          <div className="p-4 border border-dashed border-indigo-200 rounded-xl space-y-3 bg-indigo-50/20">
            <span className="text-xs font-black text-indigo-900 uppercase tracking-wider block">Ajouter des articles</span>
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-6 space-y-1">
                <Label className="text-[11px] font-medium text-slate-500">Choisir le réactif</Label>
                <Select value={currentReagentId} onValueChange={setCurrentReagentId}>
                  <SelectTrigger className="rounded-xl bg-white">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {reagents.map((r) => (
                      <SelectItem key={r.id} value={r.id} disabled={r.current_stock <= 0}>
                        {r.name} (Stock: {r.current_stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3 space-y-1">
                <Label className="text-[11px] font-medium text-slate-500">Quantité</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                  className="rounded-xl bg-white font-bold"
                />
              </div>

              <div className="col-span-3">
                <Button type="button" onClick={handleAddItem} className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl h-10">
                  <Plus size={16} className="mr-1" /> Ajouter
                </Button>
              </div>
            </div>
          </div>

          {/* CONTENU DU PANIER */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">Articles dans le panier ({cart.length})</span>
            {cart.length > 0 ? (
              <div className="border rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b">
                    <tr>
                      <th className="p-3">Réactif</th>
                      <th className="p-3 text-center">Qté</th>
                      <th className="p-3 text-right">P.U.</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cart.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="p-3 text-center font-bold">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-500">{formatFCFA(item.unitPrice)}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatFCFA(item.totalPrice)}</td>
                        <td className="p-3 text-center">
                          <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed rounded-xl text-slate-400 text-xs italic">
                Le panier est vide pour le moment.
              </div>
            )}
          </div>

          {/* Alertes et Totaux */}
          {isCreditPurchase && wouldExceedLimit && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 animate-pulse">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Blocage de Trésorerie :</span> Cette commande de {formatFCFA(cartTotal)} dépasse l'encours de crédit autorisé pour ce client.
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t pt-3 mt-1 bg-slate-50 p-4 -mx-6 -mb-6 rounded-b-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total de la Commande</span>
            <span className="text-xl font-black text-slate-900">{formatFCFA(cartTotal)}</span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-xl">
              Annuler
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit} 
              disabled={isLoading || cart.length === 0 || (isCreditPurchase && wouldExceedLimit)} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md px-6"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Valider la Facture / Livraison"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderDialog;