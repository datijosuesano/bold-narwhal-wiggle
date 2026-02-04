import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Building2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ContractsTable from '@/components/ContractsTable';
import ContractDetailView from '@/components/ContractDetailView';
import EditContractForm from '@/components/EditContractForm';
import CreateContractForm from '@/components/CreateContractForm';

interface Contract {
  id: string;
  name: string;
  provider: string;
  clinic: string;
  startDate: Date;
  endDate: Date;
  status: 'Active' | 'ExpiringSoon' | 'Expired';
  annualCost: number;
}

const ContractsPage: React.FC = () => {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleView = (contract: Contract) => {
    setSelectedContract(contract);
    setIsDetailOpen(true);
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setIsEditOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    // Rafraîchissement simulé
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Contrats de Maintenance</h1>
            <p className="text-lg text-muted-foreground">Suivi des engagements et garanties par clinique.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Nouveau Contrat
          </Button>
          <DialogContent className="sm:max-w-[500px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Ajouter un Contrat</DialogTitle>
              <DialogDescription>Enregistrez un nouvel engagement de maintenance.</DialogDescription>
            </DialogHeader>
            <CreateContractForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-lg border-l-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Contrats Actifs</CardTitle>
            <ShieldCheck className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">12</div></CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Échéances 30j</CardTitle>
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">3</div></CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Budget Annuel Global</CardTitle>
            <Building2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">84 500 €</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Liste des Contrats</CardTitle>
              <CardDescription>Vue d'ensemble de tous les contrats de maintenance actifs et passés.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Rechercher un contrat..." className="pl-10 rounded-xl" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ContractsTable onView={handleView} onEdit={handleEdit} />
        </CardContent>
      </Card>

      {/* Modale de Visualisation */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Détails du Contrat</DialogTitle>
          </DialogHeader>
          {selectedContract && <ContractDetailView contract={selectedContract} />}
        </DialogContent>
      </Dialog>

      {/* Modale de Modification */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Modifier le Contrat</DialogTitle>
            <DialogDescription>Mettez à jour les termes du contrat.</DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <EditContractForm 
              contract={selectedContract} 
              onSuccess={() => setIsEditOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractsPage;