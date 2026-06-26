"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useReactToPrint } from "react-to-print";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Search, CheckCircle2, Loader2, Calendar, MapPin, Edit2, Trash2, FileText, ChevronDown, XCircle, ShieldCheck, ShieldAlert, Warehouse, Eye, FileSpreadsheet, Clock, FileCheck2, Printer, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import AddPastInterventionForm from '@/components/AddPastInterventionForm';
import CreateReportForm from '@/components/CreateReportForm';
import InterventionDetailDialog from '@/components/InterventionDetailDialog';
import { useAuth } from '@/contexts/AuthContext';

// Fonction utilitaire pour le statut
const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    'Facture déposée': 'bg-green-100 text-green-700',
    'Facture non déposée': 'bg-red-100 text-red-700',
    'Sous garantie': 'bg-blue-100 text-blue-700',
    'Sous contrat': 'bg-purple-100 text-purple-700'
  };
  return <Badge className={styles[status] || 'bg-slate-100'}>{status || 'Non défini'}</Badge>;
};

const InterventionsPage: React.FC = () => {
  const { hasRole, role } = useAuth();
  const canEdit = hasRole(['admin', 'technicien biomedical']);
  const isSec = role === 'secretaire' || role === 'admin';

  const [interventions, setInterventions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<any | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchInterventions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('interventions')
      .select('*, assets(name, location, brand)')
      .order('intervention_date', { ascending: false });

    if (error) showError(error.message);
    else setInterventions(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchInterventions(); }, []);

  // --- FONCTION CORRIGÉE ---
  const getDurationString = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diffMs = e - s;
    if (isNaN(diffMs) || diffMs < 0) return null;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  };

  const handleDelete = async () => {
    if (!selectedIntervention) return;
    const temp = [...interventions];
    setInterventions(prev => prev.filter(i => i.id !== selectedIntervention.id));
    const { error } = await supabase.from('interventions').delete().eq('id', selectedIntervention.id);
    if (error) { showError("Erreur"); setInterventions(temp); }
    else showSuccess("Supprimé");
    setIsDeleteOpen(false);
  };

  const handleUpdateInvoiceStatus = async (id: string, status: string) => {
    await supabase.from('interventions').update({ invoice_status: status }).eq('id', id);
    fetchInterventions();
  };

  const filteredInterventions = useMemo(() => {
    return interventions.filter(i => 
      (i.title?.toLowerCase().includes(searchTerm.toLowerCase()) || i.rit_number?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedStatus === 'all' || i.invoice_status === selectedStatus)
    );
  }, [interventions, searchTerm, selectedStatus]);

  return (
    <div className="space-y-8">
      {/* ... Ton contenu JSX reste inchangé, utilise simplement 'getDurationString' dans la table ... */}
      {/* Ex: const duration = getDurationString(item.start_date, item.end_date); */}
      
      {/* Modale d'édition */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          {selectedIntervention && (
            <AddPastInterventionForm 
              initialData={selectedIntervention} 
              onSuccess={() => { setIsEditOpen(false); fetchInterventions(); }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterventionsPage;