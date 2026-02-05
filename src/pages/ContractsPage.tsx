import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Building2, ShieldCheck, AlertCircle, FileText } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import ContractsTable from '@/components/ContractsTable';
import ContractDetailView from '@/components/ContractDetailView';
import EditContractForm from '@/components/EditContractForm';
import CreateContractForm from '@/components/CreateContractForm';
import ContractTemplateEditor from '@/components/ContractTemplateEditor';

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
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Contrats</h1>
            <p className="text-lg text-muted-foreground">Gestion juridique et financière de la maintenance.</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-xl shadow-sm border-blue-200 text-blue-700"
            onClick={() => setIsTemplateOpen(true)}
          >
            <FileText className="mr-2 h-4 w-4" /> Éditeur de Modèle
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Nouveau Contrat
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-lg border-l-4 border-blue-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium uppercase text-muted-foreground">Contrats Actifs</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">12</div></CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-amber-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium uppercase text-muted-foreground">Échéances 30j</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">3</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <ContractsTable onView={(c) => { setSelectedContract(c); setIsDetailOpen(true); }} onEdit={(c) => { setSelectedContract(c); setIsEditOpen(true); }} />
        </CardContent>
      </Card>

      {/* Modale de l'Editeur de Modèle */}
      <Dialog open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
        <DialogContent className="max-w-4xl rounded-xl">
          <DialogHeader>
            <DialogTitle>Éditeur de Modèle de Contrat Professionnel</DialogTitle>
            <DialogDescription>Personnalisez les clauses et les prix selon votre modèle standard.</DialogDescription>
          </DialogHeader>
          <ContractTemplateEditor />
        </DialogContent>
      </Dialog>

      {/* Autres modales existantes... */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}><DialogContent><CreateContractForm onSuccess={() => setIsCreateOpen(false)} /></DialogContent></Dialog>
    </div>
  );
};

export default ContractsPage;