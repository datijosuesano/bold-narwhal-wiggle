import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ContractsTable, { Contract } from '@/components/ContractsTable';
import ContractDetailView from '@/components/ContractDetailView';
import EditContractForm from '@/components/EditContractForm';
import CreateContractForm from '@/components/CreateContractForm';
import ContractTemplateEditor from '@/components/ContractTemplateEditor';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  const fetchContracts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('end_date', { ascending: true });

    if (error) {
      showError("Erreur lors du chargement des contrats.");
    } else {
      setContracts(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchContracts(); }, []);

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
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : contracts.length}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-amber-500">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium uppercase text-muted-foreground">Échéances 30j</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : "0"} 
            </div>
          </CardContent>
        </Card>
      </div>

      <ContractsTable 
        contracts={contracts} 
        isLoading={isLoading}
        onView={(c) => { setSelectedContract(c); setIsDetailOpen(true); }} 
        onEdit={(c) => { setSelectedContract(c); setIsEditOpen(true); }} 
      />

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

      {/* Modale de création */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Nouveau Contrat de Maintenance</DialogTitle>
          </DialogHeader>
          <CreateContractForm onSuccess={() => { setIsCreateOpen(false); fetchContracts(); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractsPage;