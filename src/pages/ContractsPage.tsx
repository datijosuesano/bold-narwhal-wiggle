import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ContractsTable, { Contract } from '@/components/ContractsTable';
import ContractDetailView from '@/components/ContractDetailView';
import EditContractForm from '@/components/EditContractForm';
import CreateContractForm from '@/components/CreateContractForm';
import ContractTemplateEditor from '@/components/ContractTemplateEditor';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedDisplayNumber, setSelectedDisplayNumber] = useState<number | undefined>(undefined);
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchContracts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('contracts').select('*').order('end_date', { ascending: true });
    if (error) showError("Erreur lors du chargement des contrats.");
    else setContracts(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchContracts(); }, []);

  const handleDelete = async () => {
    if (!selectedContract) return;
    const { error } = await supabase.from('contracts').delete().eq('id', selectedContract.id);
    if (error) showError(`Erreur: ${error.message}`);
    else {
      showSuccess("Contrat supprimé.");
      fetchContracts();
    }
    setIsDeleteOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl"><ShieldCheck className="h-8 w-8 text-blue-600" /></div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Contrats</h1>
            <p className="text-lg text-muted-foreground">Gestion juridique et financière.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-blue-200" onClick={() => setIsTemplateOpen(true)}>
            <FileText className="mr-2 h-4 w-4" /> Modèle
          </Button>
          <Button className="bg-blue-600 rounded-xl shadow-md" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau Contrat
          </Button>
        </div>
      </div>

      <ContractsTable 
        contracts={contracts} 
        isLoading={isLoading}
        onView={(c, num) => { 
          setSelectedContract(c); 
          setSelectedDisplayNumber(num);
          setIsDetailOpen(true); 
        }} 
        onEdit={(c) => { setSelectedContract(c); setIsEditOpen(true); }} 
        onDelete={(c) => { setSelectedContract(c); setIsDeleteOpen(true); }}
      />

      {/* Détail */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl rounded-xl">
          {selectedContract && (
            <ContractDetailView 
              contract={{
                ...selectedContract,
                startDate: new Date(selectedContract.start_date),
                endDate: new Date(selectedContract.end_date),
                status: selectedContract.status as any,
                annualCost: selectedContract.annual_cost
              }} 
              displayNumber={selectedDisplayNumber}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modification */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-xl">
          {selectedContract && (
            <EditContractForm 
              contract={{
                ...selectedContract,
                startDate: new Date(selectedContract.start_date),
                endDate: new Date(selectedContract.end_date),
                status: selectedContract.status as any,
                annualCost: selectedContract.annual_cost
              }} 
              onSuccess={() => { setIsEditOpen(false); fetchContracts(); }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Création */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader><DialogTitle>Nouveau Contrat</DialogTitle></DialogHeader>
          <CreateContractForm 
            existingContracts={contracts.map(c => c.clinic)} 
            onSuccess={() => { setIsCreateOpen(false); fetchContracts(); }} 
          />
        </DialogContent>
      </Dialog>

      {/* Modèle */}
      <Dialog open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
        <DialogContent className="max-w-4xl rounded-xl"><ContractTemplateEditor /></DialogContent>
      </Dialog>

      {/* Suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le contrat ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContractsPage;