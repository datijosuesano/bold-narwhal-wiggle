import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Filter, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import CreateClientForm from '@/components/CreateClientForm';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchClients = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('clients').select('*');
    setClients(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl"><Building2 className="h-8 w-8 text-blue-600" /></div>
          <h1 className="text-4xl font-extrabold text-primary">Clients & Sites</h1>
        </div>
        
        <Dialog onOpenChange={(open) => !open && fetchClients()}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 rounded-xl"><Plus className="mr-2 h-4 w-4" /> Nouveau Site</Button>
          </DialogTrigger>
          <DialogContent><CreateClientForm onSuccess={() => {}} /></DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Rechercher un site..." className="pl-10 rounded-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (
        <div className="grid gap-6 md:grid-cols-3">
          {filteredClients.map(client => (
            <div key={client.id} className="p-6 bg-card border rounded-xl shadow-sm">
              <h3 className="font-bold text-xl">{client.name}</h3>
              <p className="text-sm text-muted-foreground">{client.city}</p>
              <Badge className="mt-4">{client.contract_status || 'Aucun contrat'}</Badge>
            </div>
          ))}
          {filteredClients.length === 0 && <p className="col-span-full text-center py-10 text-muted-foreground">Aucun site enregistré.</p>}
        </div>
      )}
    </div>
  );
};

export default ClientsPage;