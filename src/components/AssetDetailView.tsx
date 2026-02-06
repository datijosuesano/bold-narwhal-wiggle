import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Factory, MapPin, Calendar, DollarSign, Hash, Tag, Clock, Wrench, CheckCircle2, FileText, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AssetLifeSheet from './AssetLifeSheet'; // Import du nouveau composant

// Définition du type Asset (doit correspondre à celui utilisé dans AssetsPage)
interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'Opérationnel' | 'Maintenance' | 'En Panne';
  serialNumber: string;
  model: string;
  manufacturer: string;
  commissioningDate: Date;
  purchaseCost: number;
}

// Données mockées pour l'historique des OT
interface WorkOrderHistory {
    id: string;
    title: string;
    date: Date;
    status: 'Completed' | 'InProgress';
    type: 'Preventive' | 'Corrective';
}

const mockHistory: WorkOrderHistory[] = [
    { id: 'OT-1004', title: 'Remplacement du filtre à air', date: new Date('2024-05-10'), status: 'Completed', type: 'Preventive' },
    { id: 'OT-1003', title: 'Réparation d\'une fuite mineure', date: new Date('2024-06-01'), status: 'Completed', type: 'Corrective' },
    { id: 'OT-1005', title: 'Inspection de sécurité trimestrielle', date: new Date('2024-07-15'), status: 'InProgress', type: 'Preventive' },
];

interface AssetDetailViewProps {
  asset: Asset;
}

const AssetDetailView: React.FC<AssetDetailViewProps> = ({ asset }) => {
  const [activeTab, setActiveTab] = useState('details');
  
  const getStatusStyle = (status: Asset['status']) => {
    switch (status) {
      case 'Opérationnel': return 'bg-green-500 text-white';
      case 'Maintenance': return 'bg-amber-500 text-white';
      case 'En Panne': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Section Statut et Infos Clés */}
      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl border">
        <div className="flex items-center space-x-4">
          <Factory className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-xl font-bold">{asset.name}</h3>
            <p className="text-sm text-muted-foreground">ID: {asset.id} | Catégorie: {asset.category}</p>
          </div>
        </div>
        <span className={cn(
          "px-4 py-2 rounded-full text-sm font-semibold shadow-md",
          getStatusStyle(asset.status)
        )}>
          {asset.status}
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="details" className="rounded-lg px-4">Détails Rapides</TabsTrigger>
            <TabsTrigger value="life-sheet" className="rounded-lg px-4">Fiche de Vie</TabsTrigger>
          </TabsList>
          
          {activeTab === 'life-sheet' && (
            <Button 
              onClick={handlePrint} 
              className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md print:hidden"
            >
              <Printer size={16} className="mr-2" /> Imprimer / PDF
            </Button>
          )}
        </div>

        <TabsContent value="details" className="space-y-6">
          {/* Détails Techniques */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Spécifications Techniques</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-3">
                <Hash size={16} className="text-muted-foreground" />
                <p><span className="font-medium">N° Série:</span> {asset.serialNumber}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Tag size={16} className="text-muted-foreground" />
                <p><span className="font-medium">Modèle:</span> {asset.model}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Factory size={16} className="text-muted-foreground" />
                <p><span className="font-medium">Fabricant:</span> {asset.manufacturer}</p>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin size={16} className="text-muted-foreground" />
                <p><span className="font-medium">Localisation:</span> {asset.location}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar size={16} className="text-muted-foreground" />
                <p><span className="font-medium">Mise en service:</span> {format(asset.commissioningDate, 'dd MMMM yyyy', { locale: fr })}</p>
              </div>
              <div className="flex items-center space-x-3">
                <DollarSign size={16} className="text-muted-foreground" />
                <p><span className="font-medium">Coût d'achat:</span> {formatCurrency(asset.purchaseCost)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Historique des Ordres de Travail */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Historique des 3 derniers OT</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {mockHistory.map((ot) => (
                  <div key={ot.id} className="flex justify-between items-center p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3">
                        {ot.status === 'Completed' ? (
                            <CheckCircle2 size={18} className="text-green-500" />
                        ) : (
                            <Clock size={18} className="text-amber-500 animate-pulse" />
                        )}
                        <div>
                            <p className="font-medium">{ot.title}</p>
                            <p className="text-xs text-muted-foreground">
                                {ot.type === 'Preventive' ? 'Préventive' : 'Corrective'} | {format(ot.date, 'dd/MM/yyyy')}
                            </p>
                        </div>
                    </div>
                    <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        ot.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    )}>
                        {ot.status === 'Completed' ? 'Terminé' : 'En Cours'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="life-sheet">
          <AssetLifeSheet asset={asset} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetDetailView;