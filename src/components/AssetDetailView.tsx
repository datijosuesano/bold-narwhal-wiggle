import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, MapPin, Calendar, DollarSign, Hash, Tag, Clock, Wrench, CheckCircle2, FileText, Printer, ShieldAlert, Image as ImageIcon, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import AssetLifeSheet from './AssetLifeSheet';
import AddPastInterventionForm from './AddPastInterventionForm';

interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  status: 'Opérationnel' | 'Maintenance' | 'En Panne';
  serialNumber: string;
  model: string;
  brand?: string;
  manufacturer: string;
  manufacturingDate?: Date;
  commissioningDate: Date;
  expiryDate?: Date | null;
  purchaseCost: number;
  image_url?: string;
}

interface AssetDetailViewProps {
  asset: Asset;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'XOF',
    currencyDisplay: 'symbol'
  }).format(amount).replace('XOF', 'FCFA');
};

const AssetDetailView: React.FC<AssetDetailViewProps> = ({ asset }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const getStatusStyle = (status: Asset['status']) => {
    switch (status) {
      case 'Opérationnel': return 'bg-green-500 text-white';
      case 'Maintenance': return 'bg-amber-500 text-white';
      case 'En Panne': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleActionSuccess = () => {
    setIsActionOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl border">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border">
            {asset.image_url ? (
              <img src={asset.image_url} alt={asset.name} className="h-full w-full object-cover" />
            ) : (
              <Factory className="h-6 w-6 text-primary" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold">{asset.name}</h3>
            <p className="text-sm text-muted-foreground">ID: {asset.id} | {asset.category}</p>
          </div>
        </div>
        <span className={cn("px-4 py-2 rounded-full text-sm font-semibold shadow-md", getStatusStyle(asset.status))}>
          {asset.status}
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="details" className="rounded-lg px-4">Détails</TabsTrigger>
            <TabsTrigger value="life-sheet" className="rounded-lg px-4">Fiche de Vie</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 rounded-xl shadow-md text-white">
                  <PlusCircle size={16} className="mr-2" /> Enregistrer une action
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-xl">
                <DialogHeader>
                  <DialogTitle>Enregistrer une action passée</DialogTitle>
                  <DialogDescription>Ajoutez une intervention déjà réalisée à l'historique de cet équipement.</DialogDescription>
                </DialogHeader>
                <AddPastInterventionForm assetId={asset.id} onSuccess={handleActionSuccess} />
              </DialogContent>
            </Dialog>
            
            <Button onClick={() => window.print()} variant="outline" className="flex-1 sm:flex-none rounded-xl border-blue-200 text-blue-600 print:hidden">
              <Printer size={16} className="mr-2" /> Imprimer
            </Button>
          </div>
        </div>

        <TabsContent value="details" className="space-y-6">
          {asset.image_url && (
            <Card className="overflow-hidden shadow-lg border-none">
              <img src={asset.image_url} alt={asset.name} className="w-full max-h-[300px] object-contain bg-muted/20" />
            </Card>
          )}

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg">Spécifications Techniques</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-3 text-muted-foreground"><Hash size={16} /> <p><span className="font-bold text-foreground">N° Série:</span> {asset.serialNumber}</p></div>
              <div className="flex items-center space-x-3 text-muted-foreground"><Tag size={16} /> <p><span className="font-bold text-foreground">Marque / Modèle:</span> {asset.brand} - {asset.model}</p></div>
              <div className="flex items-center space-x-3 text-muted-foreground"><Factory size={16} /> <p><span className="font-bold text-foreground">Fabricant:</span> {asset.manufacturer}</p></div>
              <div className="flex items-center space-x-3 text-muted-foreground"><MapPin size={16} /> <p><span className="font-bold text-foreground">Localisation:</span> {asset.location}</p></div>
              <div className="flex items-center space-x-3 text-muted-foreground"><Calendar size={16} /> <p><span className="font-bold text-foreground">Mise en service:</span> {format(asset.commissioningDate, 'dd MMMM yyyy', { locale: fr })}</p></div>
              <div className="flex items-center space-x-3 text-muted-foreground"><DollarSign size={16} /> <p><span className="font-bold text-foreground">Coût d'achat:</span> {formatCurrency(asset.purchaseCost)}</p></div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="life-sheet">
          <AssetLifeSheet asset={asset} refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetDetailView;