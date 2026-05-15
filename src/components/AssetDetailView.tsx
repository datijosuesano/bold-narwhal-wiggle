import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, MapPin, Calendar, DollarSign, Hash, Tag, User, Printer, PlusCircle, FileText, AlertTriangle, QrCode, TrendingUp, Activity } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import AssetLifeSheet from './AssetLifeSheet';
import AddPastInterventionForm from './AddPastInterventionForm';
import AssetDocuments from './AssetDocuments';
import AssetQRCode from './AssetQRCode';
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
  const [stats, setStats] = useState({
    breakdownCount: 0,
    totalCost: 0,
    lastIntervention: null as Date | null,
    frequency: 0, // jours moyens entre interventions
  });
  
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Assignee
      if (asset.assigned_to) {
        const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', asset.assigned_to).single();
        if (data) setAssigneeName(`${data.first_name} ${data.last_name}`);
      }

      // 2. Fetch Interventions for Stats
      const { data: invs } = await supabase
        .from('interventions')
        .select('intervention_date, total_cost, maintenance_type')
        .eq('asset_id', asset.id)
        .order('intervention_date', { ascending: false });

      if (invs && invs.length > 0) {
        const breakdowns = invs.filter(i => i.maintenance_type === 'Corrective' || i.maintenance_type === 'Curative').length;
        const totalCost = invs.reduce((acc, curr) => acc + (Number(curr.total_cost) || 0), 0);
        const lastDate = new Date(invs[0].intervention_date);
        
        // Calcul fréquence (si plus d'une intervention)
        let freq = 0;
        if (invs.length > 1) {
          const firstDate = new Date(invs[invs.length - 1].intervention_date);
          const daysDiff = differenceInDays(lastDate, firstDate);
          freq = Math.round(daysDiff / (invs.length - 1));
        }

        setStats({
          breakdownCount: breakdowns,
          totalCost: totalCost,
          lastIntervention: lastDate,
          frequency: freq
        });
      }
    };
    fetchData();
  }, [asset.id, asset.assigned_to, refreshTrigger]);

  const isUnreliable = useMemo(() => stats.breakdownCount >= 3, [stats.breakdownCount]);

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

      {isUnreliable && (
        <Card className="bg-red-50 border-red-200 text-red-800">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 animate-pulse" />
            <div>
              <p className="font-bold">Alerte Fiabilité : Équipement Critique</p>
              <p className="text-xs">Cet appareil a subi {stats.breakdownCount} pannes majeures. Envisager un remplacement ou une révision complète.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="bg-muted p-1 rounded-xl overflow-x-auto">
            <TabsTrigger value="details" className="rounded-lg px-4">Détails</TabsTrigger>
            <TabsTrigger value="analysis" className="rounded-lg px-4">Analyse</TabsTrigger>
            <TabsTrigger value="life-sheet" className="rounded-lg px-4">Fiche de Vie</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg px-4">Docs</TabsTrigger>
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
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-50 border-none shadow-sm">
              <CardContent className="p-4 text-center">
                <Activity className="mx-auto h-5 w-5 text-red-500 mb-2" />
                <p className="text-[10px] font-black uppercase text-slate-400">Pannes</p>
                <p className="text-2xl font-black">{stats.breakdownCount}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-none shadow-sm">
              <CardContent className="p-4 text-center">
                <TrendingUp className="mx-auto h-5 w-5 text-blue-500 mb-2" />
                <p className="text-[10px] font-black uppercase text-slate-400">Fréquence</p>
                <p className="text-2xl font-black">{stats.frequency} <span className="text-xs font-normal">j</span></p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-none shadow-sm">
              <CardContent className="p-4 text-center">
                <DollarSign className="mx-auto h-5 w-5 text-green-500 mb-2" />
                <p className="text-[10px] font-black uppercase text-slate-400">Coût Total</p>
                <p className="text-xl font-black">{stats.totalCost.toLocaleString()} F</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-none shadow-sm">
              <CardContent className="p-4 text-center">
                <Calendar className="mx-auto h-5 w-5 text-purple-500 mb-2" />
                <p className="text-[10px] font-black uppercase text-slate-400">Dernière</p>
                <p className="text-xs font-bold">{stats.lastIntervention ? format(stats.lastIntervention, 'dd/MM/yy') : '---'}</p>
              </CardContent>
            </Card>
          </div>
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