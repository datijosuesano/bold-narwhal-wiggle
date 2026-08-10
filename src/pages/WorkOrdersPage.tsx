"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Imports depuis ton nouveau dossier WorkOrder
import WorkOrderForm from "@/components/WorkOrders/WorkOrderForm";
import WorkOrdersTable from "@/components/WorkOrders/WorkOrdersTable";
import { workOrderService } from "@/components/WorkOrders/workOrderService";
import { showError, showSuccess } from "@/utils/toast";

const WorkOrdersPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOT, setEditingOT] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEdit = (ot: any) => {
    setEditingOT(ot);
    setIsFormOpen(true);
  };

  const handleDelete = async (ot: any) => {
    if (!confirm("Supprimer cet ordre de travail ?")) return;
    try {
      await workOrderService.deleteWorkOrder(ot.id);
      showSuccess("Supprimé avec succès");
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      showError("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Ordres de Travail</h1>
          <p className="text-muted-foreground">Gestion et suivi des demandes de maintenance.</p>
        </div>
        <Button 
          onClick={() => { setEditingOT(null); setIsFormOpen(true); }} 
          className="bg-blue-600 rounded-xl font-bold shadow-lg h-11"
        >
          <Plus className="mr-2 h-4 w-4" /> Nouvel OT
        </Button>
      </div>

      <WorkOrdersTable 
        refreshTrigger={refreshTrigger} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) setEditingOT(null); setIsFormOpen(open); }}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingOT ? "Modifier l'OT" : "Créer un Ordre de Travail"}</DialogTitle>
          </DialogHeader>
          <WorkOrderForm 
            initialData={editingOT} 
            onSuccess={() => { setIsFormOpen(false); setRefreshTrigger(prev => prev + 1); }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkOrdersPage;