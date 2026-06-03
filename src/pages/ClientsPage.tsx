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
import { cn } from '@/lib/utils';

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
  client_id: string;
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

  // 🔥 FETCH OPTIMISÉ
  const fetchData = async () => {
    setIsLoading(true);

    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, city, address, contact_name, phone');

    const { data: contractsData, error: contractsError } = await supabase
      .from('contracts')
      .select('id, client_id, status')
      .eq('status', 'Active');

    if (clientsError || contractsError) {
      showError("Erreur lors du chargement des données.");
      setIsLoading(false);
      return;
    }

    setClients(clientsData || []);
    setActiveContracts(contractsData || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔥 MAP pour lookup rapide (optimisation perf)
  const activeContractMap = useMemo(() => {
    return new Set(activeContracts.map(c => c.client_id));
  }, [activeContracts]);

  // 🔍 FILTER
  const filteredClients = useMemo(() => {
    return clients.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  // 🗑 DELETE
  const handleDelete = async () => {
    if (!selectedClient) return;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', selectedClient.id);

    if (error) {
      showError(error.message);
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
            <h1 className="text-4xl font-extrabold">Clients & Sites</h1>
            <p className="text-muted-foreground">Gestion des sites clients</p>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau site
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un client</DialogTitle>
              <DialogDescription>Créer un nouveau site</DialogDescription>
            </DialogHeader>

            <CreateClientForm onSuccess={() => {
              setIsCreateOpen(false);
              fetchData();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH */}
      <div className="max-w-md relative">
        <Search className="absolute left-3 top-3 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LOADING */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {filteredClients.map(client => {
            const hasContract = activeContractMap.has(client.id);

            return (
              <div key={client.id} className="p-6 border rounded-xl hover:shadow">

                {/* HEADER CARD */}
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold">{client.name}</h3>
                    <div className="text-sm text-gray-500 flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {client.city}
                    </div>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                    <Button size="icon" variant="ghost" onClick={() => {
                      setSelectedClient(client);
                      setIsEditOpen(true);
                    }}>
                      <Edit2 size={16} />
                    </Button>

                    <Button size="icon" variant="ghost" onClick={() => {
                      setSelectedClient(client);
                      setIsDeleteOpen(true);
                    }}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                {/* INFO */}
                <div className="mt-4 text-sm space-y-1">
                  <div className="flex items-center">
                    <User size={14} className="mr-2" />
                    {client.contact_name}
                  </div>
                  <div className="flex items-center">
                    <Phone size={14} className="mr-2" />
                    {client.phone}
                  </div>
                </div>

                {/* FOOTER */}
                <div className="mt-4">
                  {hasContract ? (
                    <Badge className="bg-green-100 text-green-700">
                      <ShieldCheck size={12} className="mr-1" />
                      Sous contrat
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
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

      {/* MODALS */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
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
        <DialogContent>
          {selectedClient && (
            <CreateContractForm
              defaultClinicName={selectedClient.name}
              existingContracts={activeContracts}
              onSuccess={() => {
                setIsCreateContractOpen(false);
                fetchData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Action irréversible pour {selectedClient?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default ClientsPage;