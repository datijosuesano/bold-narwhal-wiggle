import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, MapPin, Calendar, DollarSign, Hash, Tag, User, Printer, PlusCircle, FileText, AlertTriangle, FileCode } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import AssetLifeSheet from './AssetLifeSheet';
import AddPastInterventionForm from './AddPastInterventionForm';
import AssetDocuments from './AssetDocuments';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  commissioningDate: Date;
  expiryDate?: Date | null;
  purchaseCost: number;
  image_url?: string;
  assigned_to?: string | null;
  description?: string;
}

interface AssetDetailViewProps {
  asset: Asset;
}

const AssetDetailView: React.FC<AssetDetailViewProps> = ({ asset }) => {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'technicien biomedical']);

  const [activeTab, setActiveTab] = useState('details');
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [assigneeName, setAssigneeName] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAssignee = async () => {
      if (asset.assigned_to) {
        const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', asset.assigned_to).single();
        if (data) setAssigneeName(`${data.first_name} ${data.last_name}`);
      } else {
        setAssigneeName(null);
      }
    };
    fetchAssignee();
  }, [asset.assigned_to]);

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
            {asset.image_url ? <img src={asset.image_url} alt={asset.name} className="h-full w-full object-cover" /> : <Factory className="h-6 w-6 text-primary" />}
          </div>
          <div>
            <h3 className="text-xl font-bold">{asset.name}</h3>
            <p className="text-sm text-muted-foreground">{asset.category}</p>
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
            <TabsTrigger value="documents" className="rounded-lg px-4">Docs Tech</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            {canEdit && (
              <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 rounded-xl text-white"><PlusCircle size={16} className="mr-2" /> Action</Button>
                </DialogTrigger>
                <DialogContent className="rounded-xl">
                  <DialogHeader><DialogTitle>Enregistrer une action</DialogTitle></DialogHeader>
                  <AddPastInterventionForm assetId={asset.id} onSuccess={() => { setIsActionOpen(false); setRefreshTrigger(prev => prev + 1); }} />
                </DialogContent>
              </Dialog>
            )}
            <Button onClick={() => window.print()} variant="outline" className="rounded-xl"><Printer size={16} /></Button>
          </div>
        </div>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="shadow-lg border-l-4 border-blue-600">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-bold uppercase text-muted-foreground">Responsabilité</CardTitle></CardHeader>
              <CardContent className="flex items-center text-lg font-bold">
                <User size={24} className="mr-3 text-blue-600" />
                {assigneeName ? (
                  <div className="flex flex-col">
                    <span>{assigneeName}</span>
                    <span className="text-xs font-normal text-muted-foreground">Technicien assigné</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic font-normal text-sm">Non assigné</span>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-purple-600">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-bold uppercase text-muted-foreground">Fin de vie / Garantie</CardTitle></CardHeader>
              <CardContent className="flex items-center text-lg font-bold">
                <AlertTriangle size={24} className="mr-3 text-purple-600" />
                {asset.expiryDate ? (
                  <div className="flex flex-col">
                    <span>{format(asset.expiryDate, 'dd MMMM yyyy', { locale: fr })}</span>
                    <span className="text-xs font-normal text-muted-foreground">Échéance prévue</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic font-normal text-sm">Non renseigné</span>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold uppercase text-muted-foreground flex items-center"><FileText size={16} className="mr-2" /> Description / Notes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                {asset.description || "Aucune description détaillée."}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader><CardTitle className="text-lg">Fiche Technique</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-3"><Hash size={16} className="text-blue-500" /> <p><b>S/N:</b> {asset.serialNumber}</p></div>
              <div className="flex items-center space-x-3"><Tag size={16} className="text-blue-500" /> <p><b>Modèle:</b> {asset.brand} {asset.model}</p></div>
              <div className="flex items-center space-x-3"><MapPin size={16} className="text-blue-500" /> <p><b>Site:</b> {asset.location}</p></div>
              <div className="flex items-center space-x-3"><Calendar size={16} className="text-blue-500" /> <p><b>Mis en service:</b> {format(asset.commissioningDate, 'dd/MM/yyyy')}</p></div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="life-sheet">
          <AssetLifeSheet asset={asset} refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="documents">
          <AssetDocuments assetId={asset.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetDetailView;