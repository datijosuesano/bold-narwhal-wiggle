"use client";

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
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate