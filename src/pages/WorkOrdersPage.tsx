"use client";

import React, { useState, useMemo, useCallback } from "react";
import { FilePlus, Search, Loader2, Edit2, Trash2, Clock, Calendar, Wrench, FileSpreadsheet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import WorkOrderForm from "@/components/WorkOrderForm";
import AddPastInterventionForm from "@/components/interventions/AddPastInterventionForm";
import InterventionDetailDialog from "@/components/InterventionDetailDialog";
import { useWorkOrders, WorkOrder } from "@/hooks/useWorkOrders";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const WorkOrdersPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'technicien_biomedical']);

  const {
    workOrders,
    isLoading,
    isDetailLoading,
    linkedIntervention,
    fetchData,
    deleteWorkOrder,
    fetchLinkedIntervention,
    setLinkedIntervention
  } = useWorkOrders();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isInterventionOpen, setIsInterventionOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [selectedOT, setSelectedOT] = useState<WorkOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpenIntervention = useCallback((ot: WorkOrder) => {
    setSelectedOT(ot);
    setIsInterventionOpen(true);
  }, []);

  const handleViewLinkedIntervention = useCallback(async (interventionId: string) => {
    const data = await fetchLinkedIntervention(interventionId);
    if (data) {
      setIsDetailOpen(true);
    }
  }, [fetchLinkedIntervention]);

  const handleDelete = useCallback(async () => {
    if (!selectedOT) return;
    await deleteWorkOrder(selectedOT.id);
    setIsDeleteOpen(false);
    setSelectedOT(null);
  }, [selectedOT, deleteWorkOrder]);

  const handleOpenEdit = useCallback((ot: WorkOrder) => {
    setSelectedOT(ot);
    setIsEditOpen(true);
  }, []);

  const handleOpenDelete = useCallback((ot: WorkOrder) => {
    setSelectedOT(ot);
    setIsDeleteOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setLinkedIntervention(null);
  }, [setLinkedIntervention]);

  const filteredOTs = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    if (!normalizedSearch) return workOrders;

    return workOrders.filter(ot => {
      const titleMatch = (ot.title || "").toLowerCase().includes(normalizedSearch);
      const assetMatch = (ot.assets?.name || "").toLowerCase().includes(normalizedSearch);
      return titleMatch || assetMatch;
    });
  }, [workOrders, searchTerm]);

  const getPriorityColor = useCallback((p: string) => {
    switch (p) {
      case 'Critique': return 'bg-red-900 text-white';
      case 'Élevée': return 'bg-red-500 text-white';
      case 'Moyenne': return 'bg-amber-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Ordres de Travail</h1>
          <p className="text-lg text-muted-foreground">Suivi des demandes et pipeline d'exécution.</p>
        </div>
        
        {canEdit && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg h-12 px-6 font-bold">
                <FilePlus className="mr-2 h-5 w-5" /> Créer un OT
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Nouvel Ordre de Travail</DialogTitle>
                <DialogDescription>Créez une nouvelle demande d'intervention technique.</DialogDescription>
              </DialogHeader>
              <WorkOrderForm onSuccess={() => { setIsCreateOpen(false); fetchData(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Rechercher par objet ou équipement..." 
            className="pl-10 rounded-xl border-none bg-slate-50 h-11" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card className="shadow-xl border-none overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">Priorité</th>
                  <th className="px-6 py-4">Objet / Équipement</th>
                  <th className="px-6 py-4">Ouvert le</th>
                  <th className="px-6 py-4">Technicien</th>
                  <th className="px-6 py-4">Échéance</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20">
                      <Loader2 className="animate-spin mx-auto text-blue-600 h-10 w-10" />
                    </td>
                  </tr>
                ) : filteredOTs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-muted-foreground italic">
                      Aucun ordre de travail.
                    </td>
                  </tr>
                ) : (
                  filteredOTs.map((ot) => (
                    <tr key={ot.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Badge className={cn("rounded-full text-[9px] font-black uppercase px-3", getPriorityColor(ot.priority))}>
                          {ot.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{ot.title}</div>
                        <div className="text-[10px] text-blue-600 font-black uppercase">
                          {ot.assets?.name || 'Inconnu'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-xs font-medium text-slate-600">
                          <Calendar size={12} className="mr-1 text-slate-400" />
                          {format(new Date(ot.created_at), 'dd/MM/yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-700">
                          {ot.technician_name || "Non assigné"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold">
                        <div className="flex items-center">
                          <Clock size={12} className="mr-1 text-slate-400" />
                          {ot.due_date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="rounded-full text-[9px] font-black uppercase">
                          {ot.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 items-center">
                          {canEdit && ot.status !== 'Terminé' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-xl h-8 text-[10px] font-bold border-green-200 text-green-700 hover:bg-green-50 mr-2"
                              onClick={() => handleOpenIntervention(ot)}
                            >
                              <Wrench size={10} className="mr-1.5" /> Réaliser l'intervention
                            </Button>
                          )}

                          {ot.status === 'Terminé' && ot.intervention_id && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-xl h-8 text-[10px] font-bold border-blue-200 text-blue-700 hover:bg-blue-50 mr-2"
                              onClick={() => handleViewLinkedIntervention(ot.intervention_id!)}
                              disabled={isDetailLoading}
                            >
                              {isDetailLoading ? (
                                <Loader2 className="animate-spin h-3 w-3 mr-1.5" />
                              ) : (
                                <FileSpreadsheet size={10} className="mr-1.5" />
                              )}
                              Voir le RIT
                            </Button>
                          )}

                          {canEdit && (
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-full" 
                                onClick={() => handleOpenEdit(ot)}
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full" 
                                onClick={() => handleOpenDelete(ot)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Saisir Intervention liée à l'OT */}
      <Dialog open={isInterventionOpen} onOpenChange={setIsInterventionOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Enregistrer l'Intervention</DialogTitle>
            <DialogDescription>Cette action saisit le rapport technique et clôture définitivement cet Ordre de Travail.</DialogDescription>
          </DialogHeader>
          {selectedOT && (
            <AddPastInterventionForm 
              initialData={selectedOT} 
              onSuccess={() => { setIsInterventionOpen(false); fetchData(); }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Visualiser le RIT lié */}
      <InterventionDetailDialog 
        intervention={linkedIntervention} 
        isOpen={isDetailOpen} 
        onClose={handleCloseDetail} 
      />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Modifier l'OT</DialogTitle>
            <DialogDescription>Mettez à jour les détails de cet ordre de travail.</DialogDescription>
          </DialogHeader>
          {selectedOT && <WorkOrderForm initialData={selectedOT} onSuccess={() => { setIsEditOpen(false); fetchData(); }} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Supprimer cet ordre de travail ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkOrdersPage;