import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Plus, Phone, Mail, MapPin, History, MessageSquare, ShieldCheck, Users, Search, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import CreateClientForm from '@/components/CreateClientForm';
import ClientHistoryView from '@/components/ClientHistoryView';
import CreateInteractionForm from '@/components/CreateInteractionForm';
import { showSuccess } from '@/utils/toast';

interface Client {
  id: string;
  name: string;
  address: string;
  city: string;
  contactName: string;
  phone: string;
  contractStatus: 'Active' | 'None' | 'Expiring';
}

const mockClients: Client[] = [
  { id: 'CLI-01', name: 'Clinique du Parc', address: '12 Avenue des Alpes', city: 'Paris', contactName: 'Dr. Martin', phone: '0144556677', contractStatus: 'Active' },
  { id: 'CLI-02', name: 'Hôpital Privé Nord', address: 'Boulevard de la Paix', city: 'Lille', contactName: 'Mme. Durand', phone: '0320112233', contractStatus: 'Expiring' },
  { id: 'CLI-03', name: 'Centre Médical Sud', address: 'Place de la République', city: 'Marseille', contactName: 'M. Lefebvre', phone: '0491001122', contractStatus: 'None' },
];

const ClientsPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInteractionOpen, setIsInteractionOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Recherche fonctionnelle
  const filteredClients = useMemo(() => {
    return mockClients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleOpenHistory = (client: Client) => {
    setSelectedClient(client);
    setIsHistoryOpen(true);
  };

  const handleOpenInteraction = (client?: Client) => {
    setSelectedClient(client || mockClients[0]); // Par défaut le premier si non spécifié
    setIsInteractionOpen(true);
  };

  const handleOpenContract = (client: Client) => {
     showSuccess(`Détails du contrat de ${client.name} consultables dans l'onglet Contrats.`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Clients & CRM</h1>
            <p className="text-lg text-muted-foreground">Gestion multi-sites et suivi de la relation client.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Nouveau Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Ajouter un Site</DialogTitle>
              <DialogDescription>Enregistrez un nouvel établissement dans votre réseau.</DialogDescription>
            </DialogHeader>
            <CreateClientForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="registry" className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl mb-6">
          <TabsTrigger value="registry" className="rounded-lg px-6">Registre des Sites</TabsTrigger>
          <TabsTrigger value="tracking" className="rounded-lg px-6">Suivi Relationnel</TabsTrigger>
        </TabsList>

        {/* Tab Registre */}
        <TabsContent value="registry" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Rechercher un établissement, une ville ou un contact..." 
                  className="pl-10 rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <Button variant="outline" className="rounded-xl"><Filter size={18} className="mr-2"/> Filtrer</Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <Card key={client.id} className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-blue-500 bg-card group">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl font-black group-hover:text-blue-600 transition-colors">{client.name}</CardTitle>
                      <Badge variant={client.contractStatus === 'Active' ? 'default' : 'destructive'} className="rounded-full">
                        {client.contractStatus === 'Active' ? 'Contrat Actif' : client.contractStatus === 'Expiring' ? 'Échéance' : 'Sans Contrat'}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center pt-2">
                      <MapPin size={14} className="mr-1" /> {client.address}, {client.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 p-3 rounded-xl space-y-2 border border-border/50">
                      <div className="flex items-center text-sm font-medium">
                        <Users size={14} className="mr-2 text-blue-600" /> {client.contactName}
                      </div>
                      <div className="flex items-center text-sm font-medium">
                        <Phone size={14} className="mr-2 text-blue-600" /> {client.phone}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-blue-100 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => handleOpenHistory(client)}
                      >
                        <History size={14} className="mr-1"/> Historique
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-blue-100 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => handleOpenContract(client)}
                      >
                        <ShieldCheck size={14} className="mr-1"/> Contrat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-2xl">
                Aucun établissement ne correspond à votre recherche.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab Suivi */}
        <TabsContent value="tracking" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Dernières Interactions</CardTitle>
                <CardDescription>Suivi des échanges récents avec vos clients.</CardDescription>
              </div>
              <Button size="sm" className="rounded-xl bg-blue-600" onClick={() => handleOpenInteraction()}>
                <Plus size={16} className="mr-2"/> Noter un échange
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start space-x-4 p-4 rounded-xl border hover:bg-accent/50 transition-all hover:translate-x-1 cursor-pointer">
                    <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                      <Phone size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-bold text-foreground">Appel entrant : Clinique du Parc</h4>
                        <span className="text-xs text-muted-foreground font-medium">Il y a {i * 2}h</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        Signalement d'un bruit suspect sur l'autoclave. Programmation d'une visite de contrôle pour demain matin avec l'équipe technique.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="outline" className="text-[10px] rounded-full bg-blue-50 border-blue-200 text-blue-700">Support Technique</Badge>
                        <Badge variant="outline" className="text-[10px] rounded-full bg-amber-50 border-amber-200 text-amber-700">Urgent</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-blue-100 hover:text-blue-600"
                      onClick={() => handleOpenInteraction()}
                    >
                      <MessageSquare size={16}/>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modale Historique */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Historique du Site</DialogTitle>
            <DialogDescription>Consultez la liste des interventions passées et planifiées.</DialogDescription>
          </DialogHeader>
          {selectedClient && <ClientHistoryView clientName={selectedClient.name} />}
        </DialogContent>
      </Dialog>

      {/* Modale Interaction CRM */}
      <Dialog open={isInteractionOpen} onOpenChange={setIsInteractionOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Nouvelle Interaction</DialogTitle>
            <DialogDescription>Notez les détails de l'échange et programmez une suite si besoin.</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <CreateInteractionForm 
              clientName={selectedClient.name} 
              onSuccess={() => setIsInteractionOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;