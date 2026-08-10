import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Factory, Calendar, Wrench, CheckCircle2, Clock, Loader2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';

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

interface HistoryItem {
    id: string;
    title: string;
    date: string;
    status: string;
    type: string;
    source: 'OT' | 'Intervention';
}

interface AssetLifeSheetProps {
  asset: Asset;
  refreshTrigger?: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'XOF',
    currencyDisplay: 'symbol'
  }).format(amount).replace('XOF', 'FCFA');
};

const AssetLifeSheet: React.FC<AssetLifeSheetProps> = ({ asset, refreshTrigger }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      
      // Fetch Work Orders
      const { data: ots } = await supabase
        .from('work_orders')
        .select('*')
        .eq('asset_id', asset.id);
      
      // Fetch Interventions
      const { data: interventions } = await supabase
        .from('interventions')
        .select('*')
        .eq('asset_id', asset.id);
      
      const combined: HistoryItem[] = [
        ...(ots?.map(ot => ({
          id: ot.id,
          title: ot.title,
          date: ot.due_date,
          status: ot.status,
          type: ot.maintenance_type,
          source: 'OT' as const
        })) || []),
        ...(interventions?.map(i => ({
          id: i.id,
          title: i.title,
          date: i.intervention_date,
          status: 'Completed',
          type: i.maintenance_type,
          source: 'Intervention' as const
        })) || [])
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setHistory(combined);
      setIsLoading(false);
    };
    fetchHistory();
  }, [asset.id, refreshTrigger]);

  return (
    <div className="p-6 bg-white text-gray-900 shadow-xl border rounded-xl print:shadow-none print:border-none print:p-0">
      <div className="flex justify-between items-center border-b-4 border-blue-600 pb-4 mb-6 print:border-black">
        <h1 className="text-2xl font-extrabold text-blue-700 uppercase tracking-wider print:text-black">
          Fiche de Vie Équipement
        </h1>
        <div className="text-right">
          <p className="text-lg font-bold">{asset.name}</p>
          <p className="text-sm text-gray-600">ID: {asset.id}</p>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-3 flex items-center text-blue-700 print:text-black">
        <Factory size={20} className="mr-2" /> Informations Techniques
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
        <div className="space-y-2">
          <p><span className="font-semibold">Fabricant:</span> {asset.manufacturer}</p>
          <p><span className="font-semibold">Modèle:</span> {asset.model}</p>
          <p><span className="font-semibold">N° Série:</span> {asset.serialNumber}</p>
        </div>
        <div className="space-y-2">
          <p><span className="font-semibold">Catégorie:</span> {asset.category}</p>
          <p><span className="font-semibold">Localisation:</span> {asset.location}</p>
          <p><span className="font-semibold">Coût d'achat:</span> {formatCurrency(asset.purchaseCost)}</p>
        </div>
      </div>
      
      <Separator className="my-6" />

      <h2 className="text-lg font-bold mb-3 flex items-center text-blue-700 print:text-black">
        <Calendar size={20} className="mr-2" /> Statut et Dates
      </h2>
      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <div>
          <p className="font-semibold text-gray-500">Statut Actuel</p>
          <Badge className="mt-1 bg-green-600 text-white">{asset.status}</Badge>
        </div>
        <div>
          <p className="font-semibold text-gray-500">Mise en service</p>
          <p className="font-bold mt-1">{format(asset.commissioningDate, 'dd MMMM yyyy', { locale: fr })}</p>
        </div>
      </div>

      <Separator className="my-6" />

      <h2 className="text-lg font-bold mb-4 flex items-center text-blue-700 print:text-black">
        <Wrench size={20} className="mr-2" /> Historique des Actions ({history.length})
      </h2>
      
      {isLoading ? (
        <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="p-3">Action / Objet</th>
                <th className="p-3">Type</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Source</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((item, index) => (
                  <tr key={item.id} className={cn("border-t", index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                    <td className="p-3">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-[10px] text-muted-foreground">{item.status}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">
                        {item.type}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">{format(new Date(item.date), 'dd/MM/yyyy')}</td>
                    <td className="p-3 text-center">
                      <Badge className={cn(
                        "text-[9px] uppercase",
                        item.source === 'Intervention' ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"
                      )}>
                        {item.source}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground italic">Aucune action enregistrée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssetLifeSheet;