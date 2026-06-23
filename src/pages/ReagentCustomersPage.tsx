"use client";
import CustomerPaymentHistoryDialog from "@/components/CustomerPaymentHistoryDialog";
import { History as HistoryIcon } from "lucide-react"; // Ajoute cette icône
import React, { useState, useEffect, useMemo } from "react";
import CustomerPaymentDialog from "@/components/CustomerPaymentDialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Search, 
  Plus, 
  Loader2, 
  Phone, 
  Mail, 
  MapPin, 
  Wallet,
  AlertCircle,
  Ban,
  Edit2,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import CustomerFormDialog from "@/components/CustomerFormDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Interface mise à jour avec contact_email et contact_phone
interface ReagentCustomer {
  id: string;
  name: string;
  customer_type?: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  current_debt: number;
  credit_limit: number;
  payment_terms: string | null;
  is_active: boolean;
  created_at: string;
}

const ReagentCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<ReagentCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // États pour le formulaire d'ajout/édition
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ReagentCustomer | null>(null);

  // États pour la suppression
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // États pour le paiement
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [customerToPay, setCustomerToPay] = useState<ReagentCustomer | null>(null);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("reagent_customers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      console.error("Erreur lors du chargement des clients:", err);
      showError("Impossible de charger la liste des clients.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.contact_email && c.contact_email.toLowerCase().includes(term)) ||
        (c.contact_phone && c.contact_phone.includes(term))
    );
  }, [customers, searchTerm]);

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    try {
      const { error } = await supabase
        .from("reagent_customers")
        .delete()
        .eq("id", selectedCustomer.id);

      if (error) throw error;
      showSuccess(`Le client "${selectedCustomer.name}" a été supprimé.`);
      fetchCustomers();
    } catch (err: any) {
      showError(`Erreur lors de la suppression : ${err.message}`);
    } finally {
      setIsDeleteOpen(false);
      setSelectedCustomer(null);
    }
  };

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + " FCFA";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 rounded-2xl">
            <Building2 className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Clients & Recouvrements</h1>
            <p className="text-lg text-muted-foreground">Gestion financière des ventes de réactifs</p>
          </div>
        </div>

        <Button 
          onClick={() => {
            setSelectedCustomer(null);
            setIsFormOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md h-11 font-bold"
        >
          <Plus className="mr-2 h-4 w-4" /> Nouveau Client
        </Button>
      </div>

      {/* TABLEAU DES CLIENTS */}
      <Card className="shadow-lg border-none bg-white rounded-2xl">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-bold flex items-center text-slate-800">
              <Wallet size={18} className="mr-2 text-indigo-600" /> 
              Suivi des Comptes Clients ({customers.length})
            </CardTitle>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input 
                placeholder="Rechercher un client..." 
                className="pl-10 rounded-xl bg-white border-slate-200" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b tracking-wider">
                <tr>
                  <th className="px-6 py-4">Structure & Statut</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Situation Financière (Dette)</th>
                  <th className="px-6 py-4">Conditions</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <Loader2 className="animate-spin h-8 w-8 mx-auto text-indigo-600 mb-2" />
                      <p className="text-sm text-slate-500">Chargement des données financières...</p>
                    </td>
                  </tr>
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => {
                    const isOverLimit = customer.credit_limit > 0 && customer.current_debt >= customer.credit_limit;
                    const isNearLimit = customer.credit_limit > 0 && customer.current_debt >= (customer.credit_limit * 0.8) && !isOverLimit;

                    return (
                      <tr key={customer.id} className={cn("hover:bg-slate-50/80 transition-colors group", !customer.is_active && "bg-slate-50 opacity-75")}>
                        
                        {/* Structure & Statut */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            {customer.name}
                            {!customer.is_active && (
                              <Badge variant="destructive" className="text-[9px] py-0 h-4 flex items-center">
                                <Ban size={10} className="mr-1" /> Bloqué
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-start text-xs text-slate-500 mt-1">
                            <MapPin size={12} className="mr-1 shrink-0 mt-0.5" />
                            <span className="line-clamp-1 max-w-[200px]">{customer.address || "Adresse non renseignée"}</span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4 space-y-1">
                          <div className="flex items-center text-xs text-slate-600 font-medium">
                            <Phone size={12} className="mr-1.5 text-slate-400" />
                            {customer.contact_phone || "---"}
                          </div>
                          <div className="flex items-center text-xs text-slate-600">
                            <Mail size={12} className="mr-1.5 text-slate-400" />
                            {customer.contact_email || "---"}
                          </div>
                        </td>

                        {/* Situation Financière */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className={cn(
                              "text-sm font-black flex items-center",
                              isOverLimit ? "text-red-600" : isNearLimit ? "text-amber-500" : "text-emerald-600"
                            )}>
                              {formatFCFA(customer.current_debt)}
                              {isOverLimit && <AlertCircle size={14} className="ml-1.5" title="Limite de crédit dépassée !" />}
                            </div>
                            
                            <div className="text-[10px] text-slate-500 font-medium flex items-center">
                              Limite : {customer.credit_limit > 0 ? formatFCFA(customer.credit_limit) : "Aucune limite"}
                            </div>

                            {customer.credit_limit > 0 && (
                              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className={cn("h-full rounded-full transition-all", isOverLimit ? "bg-red-500" : isNearLimit ? "bg-amber-400" : "bg-emerald-400")}
                                  style={{ width: `${Math.min((customer.current_debt / customer.credit_limit) * 100, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Conditions de paiement */}
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-[10px] bg-white text-slate-600 font-medium border-slate-200">
                            {customer.payment_terms || "Non définies"}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Bouton Encaisser */}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              disabled={customer.current_debt <= 0}
                              className="h-8 w-8 rounded-full text-emerald-600 hover:bg-emerald-50 disabled:opacity-30"
                              title="Enregistrer un règlement"
                              onClick={() => {
                                setCustomerToPay(customer);
                                setIsPaymentOpen(true);
                              }}
                            >
                              <Wallet size={14} />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setIsDeleteOpen(true);
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-500">
                      <Wallet className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                      <p className="text-sm font-medium">Aucun client enregistré.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODALE FORMULAIRE CLIENT */}
      <CustomerFormDialog 
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedCustomer(null);
        }}
        onSuccess={fetchCustomers}
        customerToEdit={selectedCustomer}
      />

      {/* MODALE ENCAISSEMENT PAIEMENT */}
      <CustomerPaymentDialog 
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setCustomerToPay(null);
        }}
        onSuccess={fetchCustomers}
        customer={customerToPay}
      />

      {/* ALERTE DE SUPPRESSION */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le client <strong>{selectedCustomer?.name}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReagentCustomersPage;