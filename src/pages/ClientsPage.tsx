import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Plus, Search, Loader2, Edit2, Trash2, MapPin, User, Phone, ShieldCheck, FilePlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import CreateClientForm from '@/components/CreateClientForm';
import EditClientForm from '@/components/EditClientForm';
import CreateContractForm from '@/components/CreateContractForm';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface Client {
  id: string;
  name: string;
  address: string;
  city: string;
  contact_name: string;
  phone: string;
}

interface Contract {
  id: string;
  clinic: string;
  status: string;
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreateContractOpen, setIsCreateContractOpen] = useState(false);

  // FETCH OPTIMISÉ
  const fetchData = async () => {
    setIsLoading(true);

    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, city, address, contact_name, phone');

      // Le lien entre contrat et client se fait par la colonne 'clinic' contenant le nom
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('id, clinic, status')
        .eq('status', 'Active');

      if (clientsError) throw clientsError;
      if (contractsError) throw contractsError;

      setClients(clientsData || []);
      setActiveContracts((contractsData as any) || []);
    } catch (err: any) {
      console.error(err);
      showError("Erreur lors du chargement des données : " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // MAP des cliniques ayant un contrat actif pour un lookup ultra rapide
  const activeContractMap = useMemo(() => {
    return new Set(activeContracts.map(c => c.clinic));
  }, [activeContracts]);

  // FILTRE DE RECHERCHE
  const filteredClients = useMemo(() => {
    return clients.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  // SUPPRESSION CLIENT
  const handleDelete = async () => {
    if (!selectedClient) return;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', selectedClient.id);

    if (error) {
      showError("Impossible de supprimer le client : " + error.message);
      return;
    }

    showSuccess("Client supprimé avec succès");
    setIsDeleteOpen(false);
    fetchData();
  };

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-primary">Clients & Sites</h1>
            <p className="text-lg text-muted-foreground">Gestion des sites clients et établissements.</p>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau site
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Ajouter un site</DialogTitle>
              <DialogDescription>Enregistrez un nouvel établissement sanitaire.</DialogDescription>
            </DialogHeader>

            <CreateClientForm onSuccess={() => {
              setIsCreateOpen(false);
              fetchData();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* RECHERCHE */}
      <div className="max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          className="pl-10 rounded-xl bg-white shadow-sm"
          placeholder="Rechercher par nom de clinique ou ville..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* GRILLE DES COMPTES */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {filteredClients.map(client => {
            const hasContract = activeContractMap.has(client.name);

            return (
              <div key={client.id} className="p-6 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all group relative">

                {/* HEADER CARD */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{client.name}</h3>
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                      <MapPin size={12} className="mr-1 text-red-500" />
                      {client.city}
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => {
                      setSelectedClient(client);
                      setIsEditOpen(true);
                    }}>
                      <Edit2 size={14} />
                    </Button>

                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50" onClick={() => {
                      setSelectedClient(client);
                      setIsDeleteOpen(true);
                    }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* COORDINATES */}
                <div className="mt-4 text-xs space-y-2 border-t pt-3 text-slate-600">
                  <div className="flex items-center">
                    <User size={14} className="mr-2 text-slate-400" />
                    <span className="font-medium">{client.contact_name}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone size={14} className="mr-2 text-slate-400" />
                    <span className="font-mono">{client.phone}</span>
                  </div>
                </div>

                {/* CONTRAT STATUS */}
                <div className="mt-5 pt-1">
                  {hasContract ? (
                    <Badge className="bg-green-100 text-green-700 border border-green-200 rounded-full font-bold text-[10px] px-2.5 py-0.5">
                      <ShieldCheck size={12} className="mr-1" />
                      Sous contrat
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-[10px] font-bold border-blue-200 text-blue-600 hover:bg-blue-50 h-8"
                      onClick={() => {
                        setSelectedClient(client);
                        setIsCreateContractOpen(true);
                      }}
                    >
                      <FilePlus size={12} className="mr-1" />
                      Créer contrat
                    </Button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* EDITIONS & CREATIONS MODALES */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Modifier le site client</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <EditClientForm
              client={selectedClient}
              onSuccess={() => {
                setIsEditOpen(false);
                fetchData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateContractOpen} onOpenChange={setIsCreateContractOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Générer un Contrat</DialogTitle>
            <DialogDescription>Créez un accord de maintenance lié à cet établissement.</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <CreateContractForm
              defaultClinicName={selectedClient.name}
              existingContracts={activeContracts.map(c => c.clinic)}
              onSuccess={() => {
                setIsCreateContractOpen(false);
                fetchData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action retirera définitivement l'établissement <strong>{selectedClient?.name}</strong> et les contrats associés de la base.
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

export default ClientsPage;