import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilePlus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import CreateWorkOrderForm from "@/components/CreateWorkOrderForm";
import EditWorkOrderForm from "@/components/EditWorkOrderForm";
import WorkOrdersTable from "@/components/WorkOrdersTable"; 
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

const WorkOrdersPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOT, setSelectedOT] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditSuccess = () => {
    setIsEditOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDelete = async () => {
    if (!selectedOT) return;
    
    const { error } = await supabase
      .from('work_orders')
      .delete()
      .eq('id', selectedOT.id);

    if (error) {
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess("Ordre de travail supprimé.");
      setRefreshTrigger(prev => prev + 1);
    }
    setIsDeleteOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-primary tracking-tight">
          Ordres de Travail
        </h1>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <FilePlus className="mr-2 h-4 w-4" /> Créer OT
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Nouvel Ordre de Travail</DialogTitle>
            </DialogHeader>
            <CreateWorkOrderForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Liste des Ordres de Travail</CardTitle>
          <CardDescription>Suivi des tâches de maintenance.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <WorkOrdersTable 
            refreshTrigger={refreshTrigger} 
            onEdit={(ot) => { setSelectedOT(ot); setIsEditOpen(true); }}
            onDelete={(ot) => { setSelectedOT(ot); setIsDeleteOpen(true); }}
          />
        </CardContent>
      </Card>

      {/* Modale de Modification */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Modifier l'OT</DialogTitle>
          </DialogHeader>
          {selectedOT && <EditWorkOrderForm workOrder={selectedOT} onSuccess={handleEditSuccess} />}
        </DialogContent>
      </Dialog>

      {/* Alerte de Suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet ordre de travail ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'OT sera définitivement retiré de la base de données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkOrdersPage;