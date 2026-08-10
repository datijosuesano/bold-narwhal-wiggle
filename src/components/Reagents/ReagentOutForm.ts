"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Banknote, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface ReagentCustomer {
  id: string;
  name: string;
  current_debt: number;
}

interface CustomerPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer: ReagentCustomer | null;
}

const CustomerPaymentDialog: React.FC<CustomerPaymentDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customer,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("Espèces");
  const [reference, setReference] = useState("");

  // Réinitialiser les champs à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setPaymentAmount("");
      setPaymentMethod("Espèces");
      setReference("");
    }
  }, [isOpen]);

  if (!customer) return null;

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + " FCFA";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      showError("Veuillez saisir un montant valide supérieur à 0.");
      return;
    }

    if (amount > customer.current_debt) {
      showError(`Le montant du règlement dépasse la dette actuelle (${formatFCFA(customer.current_debt)}).`);
      return;
    }

    try {
      setIsLoading(true);

      // Calculer la nouvelle dette après paiement
      const newDebt = customer.current_debt - amount;

      // Mettre à jour la dette du client dans Supabase
      const { error } = await supabase
        .from("reagent_customers")
        .update({ current_debt: newDebt })
        .eq("id", customer.id);

      if (error) throw error;

      showSuccess(`Règlement de ${formatFCFA(amount)} enregistré pour ${customer.name}.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erreur enregistrement paiement:", err);
      showError(`Erreur lors de l'encaissement : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <Banknote className="text-emerald-600" size={24} /> Enregistrer un Règlement
          </DialogTitle>
          <DialogDescription>
            Saisissez le paiement reçu de la structure <strong>{customer.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-slate-50 rounded-xl border mb-2 text-center">
          <span className="text-xs uppercase font-black text-slate-400 block tracking-wider">Dette Actuelle</span>
          <span className="text-2xl font-black text-red-600">{formatFCFA(customer.current_debt)}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="font-bold text-slate-700">Montant versé (FCFA) <span className="text-red-500">*</span></Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={customer.current_debt}
              placeholder="Ex: 150000"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))}
              className="rounded-xl font-bold text-lg text-emerald-700 border-slate-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method">Mode de règlement</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="method" className="rounded-xl">
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Espèces">Espèces</SelectItem>
                  <SelectItem value="Chèque">Chèque</SelectItem>
                  <SelectItem value="Virement Bancaire">Virement Bancaire</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money (Orange/MTN/Moov)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref">N° de Pièce / Réf (Optionnel)</Label>
              <Input
                id="ref"
                placeholder="Ex: Chèque N°0482"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-xl">
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md">
              {isLoading ? (
                <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Traitement...</>
              ) : (
                <><CheckCircle2 size={16} className="mr-1.5" /> Valider l'encaissement</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerPaymentDialog;