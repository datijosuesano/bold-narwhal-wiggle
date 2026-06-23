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
import { Loader2, Building2, CreditCard, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";

interface ReagentCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  current_debt: number;
  credit_limit: number;
  payment_terms: string | null;
  is_active: boolean;
}

interface CustomerFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerToEdit?: ReagentCustomer | null;
}

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerToEdit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [creditLimit, setCreditLimit] = useState<number | "">("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (customerToEdit && isOpen) {
      setName(customerToEdit.name);
      setEmail(customerToEdit.email || "");
      setPhone(customerToEdit.phone || "");
      setAddress(customerToEdit.address || "");
      setCreditLimit(customerToEdit.credit_limit);
      setPaymentTerms(customerToEdit.payment_terms || "");
      setIsActive(customerToEdit.is_active);
    } else if (isOpen) {
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setCreditLimit("");
      setPaymentTerms("À la livraison");
      setIsActive(true);
    }
  }, [customerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showError("Le nom de la structure est obligatoire.");
      return;
    }

    try {
      setIsSubmitting(true);

      const customerData = {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        credit_limit: creditLimit === "" ? 0 : Number(creditLimit),
        payment_terms: paymentTerms || null,
        is_active: isActive,
      };

      if (customerToEdit) {
        const { error } = await supabase
          .from("reagent_customers")
          .update(customerData)
          .eq("id", customerToEdit.id);

        if (error) throw error;
        showSuccess("Fiche client mise à jour avec succès.");
      } else {
        const { error } = await supabase
          .from("reagent_customers")
          .insert([customerData]);

        if (error) throw error;
        showSuccess("Nouveau client enregistré avec succès.");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement :", error);
      showError(error.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-black text-indigo-900">
            {customerToEdit ? (
              <>Mettre à jour le client</>
            ) : (
              <><Building2 className="w-5 h-5 mr-2 text-indigo-600" /> Ajouter un Nouveau Client</>
            )}
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations de contact et les conditions financières.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Informations de contact</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-bold">Nom de la structure / Clinique <span className="text-red-500">*</span></Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Clinique Sainte-Marie" className="rounded-lg border-slate-300" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 font-medium">Téléphone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: +225 0102030405" className="rounded-lg border-slate-300" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email de facturation</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@clinique.ci" className="rounded-lg border-slate-300" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-700 font-medium">Adresse physique</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex: Cocody Angré, Abidjan" className="rounded-lg border-slate-300" />
            </div>
          </div>

          <div className="space-y-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <h3 className="text-xs font-bold uppercase text-indigo-500 mb-2 flex items-center">
              <CreditCard size={14} className="mr-1" /> Paramètres Financiers
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditLimit" className="text-slate-700 font-medium">Limite de crédit (FCFA)</Label>
                <Input 
                  id="creditLimit" 
                  type="number" 
                  min="0"
                  value={creditLimit} 
                  onChange={(e) => setCreditLimit(e.target.value)} 
                  placeholder="Ex: 500000" 
                  className="rounded-lg border-indigo-200 focus-visible:ring-indigo-500" 
                />
                <p className="text-[10px] text-slate-500">Laissez à 0 si pas de limite autorisée.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerms" className="text-slate-700 font-medium">Conditions de paiement</Label>
                <Input 
                  id="paymentTerms" 
                  value={paymentTerms} 
                  onChange={(e) => setPaymentTerms(e.target.value)} 
                  placeholder="Ex: 30 jours fin de mois" 
                  className="rounded-lg border-indigo-200 focus-visible:ring-indigo-500" 
                />
              </div>
            </div>

            {customerToEdit && (
              <div className="pt-2 mt-2 border-t border-indigo-100">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`flex items-center px-3 py-2 text-sm font-bold rounded-lg transition-colors ${
                    isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  }`}
                >
                  <Ban size={16} className="mr-2" />
                  {isActive ? "Bloquer ce client (Suspension de compte)" : "Débloquer ce client (Réactiver)"}
                </button>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="rounded-xl">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md">
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</>
              ) : (
                customerToEdit ? "Mettre à jour" : "Créer le client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerFormDialog;