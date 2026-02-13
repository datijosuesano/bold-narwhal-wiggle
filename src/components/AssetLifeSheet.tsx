import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Factory, Calendar, Wrench, CheckCircle2, Clock, Loader2 } from 'lucide-react';
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

interface WorkOrderHistory {
    id: string;
    title: string;
    due_date: string;
    status: string;
    maintenance_type: string;
}

interface AssetLifeSheetProps {
  asset: Asset;
  refreshTrigger?: number; // Pour forcer le rechargement après un ajout
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'XOF',
    currencyDisplay: 'symbol'
  }).format(amount).replace('XOF', 'FCFA');
};

const AssetLifeSheet: React.FC<AssetLifeSheetProps> = ({ asset, refreshTrigger }) => {
  const [history, setHistory] = useState<WorkOrderHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('work_orders')
        .select('*')
        .eq('asset_id', asset.id)
        .order('due_date', { ascending: false });
      
      setHistory(data || []);
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
        <Wrench size={20} className="mr-2" /> Historique des Interventions ({history.length})
      </h2>
      
      {isLoading ? (
        <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="p-3">Titre de l'Intervention</th>
                <th className="p-3">Type</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Statut</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((ot, index) => (
                  <tr key={ot.id} className={cn("border-t", index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                    <td className="p-3 font-medium">{ot.title}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        ot.maintenance_type === 'Preventive' ? 'border-green-400 text-green-700' : 'border-red-400 text-red-700'
                      )}>
                        {ot.maintenance_type === 'Preventive' ? 'Préventive' : 'Corrective'}
                      </Badge>
                    </td>
                    <td className="p-3">{format(new Date(ot.due_date), 'dd/MM/yyyy')}</td>
                    <td className="p-3 text-center">
                      {ot.status === 'Completed' ? (
                        <CheckCircle2 size={16} className="text-green-600 mx-auto" />
                      ) : (
                        <Clock size={16} className="text-amber-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground italic">Aucune intervention enregistrée pour le moment.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssetLifeSheet;