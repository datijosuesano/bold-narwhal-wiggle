import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Loader2, Edit2, Trash2, MapPin, User, Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import CreateClientForm from '@/components/CreateClientForm';
import EditClientForm from '@/components/EditClientForm';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface Client {
  id: string;
  name: string;
  address: string;
  city: string;
  contact_name: string;
  phone: string;
  contract_status: string;
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchClients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('clients').select('*').order('name');
    if (error) {
      showError("Erreur lors du chargement des sites.");
    } else {
      setClients(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const handleDelete = async () => {
    if (!selectedClient) return;
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', selectedClient.id);

    if (error) {
      showError(`Erreur lors de la suppression: ${error.message}`);
    } else {
      showSuccess(`Le site "${selectedClient.name}" a été supprimé.`);
      fetchClients();
    }
    setIsDeleteOpen(false);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Clients & Sites</h1>
            <p className="text-lg text-muted-foreground">Gestion de votre parc de sites clients.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Nouveau Site
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Ajouter un Site Client</DialogTitle>
              <DialogDescription>Créez une nouvelle fiche établissement dans votre base.</DialogDescription>
            </DialogHeader>
            <CreateClientForm onSuccess={() => { setIsCreateOpen(false); fetchClients(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Rechercher un site ou une ville..." 
          className="pl-10 rounded-xl" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map(client => (
            <div key={client.id} className="group p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl text-foreground line-clamp-1">{client.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin size={14} className="mr-1" /> {client.city}
                  </div>
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50"
                    onClick={() => { setSelectedClient(client); setIsEditOpen(true); }}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50"
                    onClick={() => { setSelectedClient(client); setIsDeleteOpen(true); }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 mt-4 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <User size={14} className="mr-2 text-blue-500" /> {client.contact_name}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Phone size={14} className="mr-2 text-blue-500" /> {client.phone}
                </div>
              </div>

              <div className="mt-6">
                <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-700 border-blue-200">
                  {client.contract_status === 'Active' ? 'Sous Contrat' : 'Sans Contrat'}
                </Badge>
              </div>
            </div>
          ))}
          
          {filteredClients.length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed">
              <Building2 className="mx-auto h-12 w-12 opacity-20 mb-2" />
              <p>Aucun site trouvé correspondant à votre recherche.</p>
            </div>
          )}
        </div>
      )}

      {/* Dialogue de modification */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Modifier le Site</DialogTitle>
            <DialogDescription>Mettez à jour les informations du site {selectedClient?.name}.</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <EditClientForm 
              client={selectedClient} 
              onSuccess={() => { setIsEditOpen(false); fetchClients(); }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Alerte de suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce site ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le site <strong>{selectedClient?.name}</strong> ? 
              Cette action est irréversible et pourrait affecter les équipements liés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientsPage;