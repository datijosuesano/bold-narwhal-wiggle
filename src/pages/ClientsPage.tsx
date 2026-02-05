import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Plus, Phone, Mail, MapPin, History, MessageSquare, ShieldCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';

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
];

const ClientsPage: React.FC = () => {
  return (
    <div className="space-y-8">
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
        <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
          <Plus className="mr-2 h-4 w-4" /> Nouveau Client
        </Button>
      </div>

      <Tabs defaultValue="registry" className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl mb-6">
          <TabsTrigger value="registry" className="rounded-lg px-6">Registre des Sites</TabsTrigger>
          <TabsTrigger value="tracking" className="rounded-lg px-6">Suivi Relationnel</TabsTrigger>
        </TabsList>

        <TabsContent value="registry" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockClients.map(client => (
              <Card key={client.id} className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-blue-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-black">{client.name}</CardTitle>
                    <Badge variant={client.contractStatus === 'Active' ? 'default' : 'destructive'} className="rounded-full">
                      {client.contractStatus === 'Active' ? 'Contrat Actif' : 'Vérifier Contrat'}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center pt-2">
                    <MapPin size={14} className="mr-1" /> {client.address}, {client.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-3 rounded-xl space-y-2">
                    <div className="flex items-center text-sm font-medium">
                      <Users size={14} className="mr-2 text-blue-600" /> {client.contactName}
                    </div>
                    <div className="flex items-center text-sm font-medium">
                      <Phone size={14} className="mr-2 text-blue-600" /> {client.phone}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl"><History size={14} className="mr-1"/> Historique</Button>
                    <Button variant="outline" size="sm" className="rounded-xl"><ShieldCheck size={14} className="mr-1"/> Contrat</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Dernières Interactions</CardTitle>
              <CardDescription>Suivi des appels et échanges récents.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start space-x-4 p-4 rounded-xl border hover:bg-accent/50 transition-colors">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                      <Phone size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-bold">Appel entrant : Clinique du Parc</h4>
                        <span className="text-xs text-muted-foreground">Il y a 2h</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Signalement d'un bruit suspect sur l'autoclave. Programmation d'une visite demain.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] rounded-full">Support</Badge>
                        <Badge variant="outline" className="text-[10px] rounded-full">Urgence</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full"><MessageSquare size={16}/></Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientsPage;