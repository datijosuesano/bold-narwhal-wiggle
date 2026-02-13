import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, MapPin, Calendar, DollarSign, Hash, Tag, Clock, Wrench, CheckCircle2, FileText, Printer, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AssetLifeSheet from './AssetLifeSheet';

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
  
  const getStatusStyle = (status: Asset['status']) => {
    switch (status) {
      case 'Opérationnel': return 'bg-green-500 text-white';
      case 'Maintenance': return 'bg-amber-500 text-white';
      case 'En Panne': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
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
        <div className="flex justify-between items-center mb-4">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="details" className="rounded-lg px-4">Détails</TabsTrigger>
            <TabsTrigger value="life-sheet" className="rounded-lg px-4">Fiche de Vie</TabsTrigger>
          </TabsList>
          
          <Button onClick={() => window.print()} className="bg-blue-600 rounded-xl shadow-md print:hidden">
            <Printer size={16} className="mr-2" /> Imprimer
          </Button>
        </div>

        <TabsContent value="details" className="space-y-6">
          {asset.image_url && (
            <Card className="overflow-hidden shadow-lg">
              <img src={asset.image_url} alt={asset.name} className="w-full max-h-[300px] object-contain bg-muted/20" />
            </Card>
          )}

          <Card className="shadow-lg">
            <CardHeader><CardTitle className="text-lg">Spécifications Techniques</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-3"><Hash size={16} className="text-muted-foreground" /> <p><span className="font-medium">N° Série:</span> {asset.serialNumber}</p></div>
              <div className="flex items-center space-x-3"><Tag size={16} className="text-muted-foreground" /> <p><span className="font-medium">Marque / Modèle:</span> {asset.brand} - {asset.model}</p></div>
              <div className="flex items-center space-x-3"><Factory size={16} className="text-muted-foreground" /> <p><span className="font-medium">Fabricant:</span> {asset.manufacturer}</p></div>
              <div className="flex items-center space-x-3"><MapPin size={16} className="text-muted-foreground" /> <p><span className="font-medium">Localisation:</span> {asset.location}</p></div>
              
              <div className="flex items-center space-x-3"><Calendar size={16} className="text-muted-foreground" /> 
                <p><span className="font-medium">Fabrication:</span> {asset.manufacturingDate ? format(asset.manufacturingDate, 'dd MMMM yyyy', { locale: fr }) : 'Non renseignée'}</p>
              </div>
              <div className="flex items-center space-x-3"><Calendar size={16} className="text-muted-foreground" /> 
                <p><span className="font-medium">Mise en service:</span> {format(asset.commissioningDate, 'dd MMMM yyyy', { locale: fr })}</p>
              </div>
              
              {asset.expiryDate && (
                <div className="flex items-center space-x-3 text-red-600"><ShieldAlert size={16} /> 
                  <p><span className="font-bold">Péremption:</span> {format(asset.expiryDate, 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
              )}
              
              <div className="flex items-center space-x-3"><DollarSign size={16} className="text-muted-foreground" /> <p><span className="font-medium">Coût:</span> {formatCurrency(asset.purchaseCost)}</p></div>
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