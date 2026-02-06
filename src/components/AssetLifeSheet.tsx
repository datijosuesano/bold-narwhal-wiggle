import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Factory, MapPin, Calendar, DollarSign, Hash, Tag, Wrench, CheckCircle2, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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

// Données mockées pour l'historique des OT (réutilisées)
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
    { id: 'OT-1006', title: 'Changement de courroie', date: new Date('2023-12-01'), status: 'Completed', type: 'Preventive' },
    { id: 'OT-1007', title: 'Panne électrique générale', date: new Date('2023-10-20'), status: 'Completed', type: 'Corrective' },
];

interface AssetLifeSheetProps {
  asset: Asset;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
};

const getStatusStyle = (status: Asset['status']) => {
  switch (status) {
    case 'Opérationnel': return 'bg-green-600 text-white';
    case 'Maintenance': return 'bg-amber-500 text-white';
    case 'En Panne': return 'bg-red-600 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const AssetLifeSheet: React.FC<AssetLifeSheetProps> = ({ asset }) => {
  const history = mockHistory; // En réalité, filtré par asset.id

  return (
    <div className="p-6 bg-white text-gray-900 shadow-xl border rounded-xl print:shadow-none print:border-none print:p-0">
      
      {/* Header Fiche de Vie */}
      <div className="flex justify-between items-center border-b-4 border-blue-600 pb-4 mb-6 print:border-black">
        <h1 className="text-2xl font-extrabold text-blue-700 uppercase tracking-wider print:text-black">
          Fiche de Vie Équipement
        </h1>
        <div className="text-right">
          <p className="text-lg font-bold">{asset.name}</p>
          <p className="text-sm text-gray-600">ID: {asset.id}</p>
        </div>
      </div>

      {/* Section 1: Informations Générales */}
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

      {/* Section 2: Statut et Dates */}
      <h2 className="text-lg font-bold mb-3 flex items-center text-blue-700 print:text-black">
        <Calendar size={20} className="mr-2" /> Statut et Durée de Vie
      </h2>
      <div className="grid grid-cols-3 gap-4 text-sm mb-6">
        <div>
          <p className="font-semibold text-gray-500">Statut Actuel</p>
          <Badge className={cn("mt-1 text-sm font-semibold", getStatusStyle(asset.status))}>
            {asset.status}
          </Badge>
        </div>
        <div>
          <p className="font-semibold text-gray-500">Date de Mise en Service</p>
          <p className="font-bold mt-1">{format(asset.commissioningDate, 'dd MMMM yyyy', { locale: fr })}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-500">Durée de Vie (Mock)</p>
          <p className="font-bold mt-1">4 ans et 8 mois</p>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Section 3: Historique de Maintenance */}
      <h2 className="text-lg font-bold mb-4 flex items-center text-blue-700 print:text-black">
        <Wrench size={20} className="mr-2" /> Historique des Interventions ({history.length})
      </h2>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="p-3">Réf. OT</th>
              <th className="p-3">Titre de l'Intervention</th>
              <th className="p-3">Type</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            {history.map((ot, index) => (
              <tr key={ot.id} className={cn("border-t", index % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                <td className="p-3 font-mono text-xs">{ot.id}</td>
                <td className="p-3 font-medium">{ot.title}</td>
                <td className="p-3">
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    ot.type === 'Preventive' ? 'border-green-400 text-green-700' : 'border-red-400 text-red-700'
                  )}>
                    {ot.type === 'Preventive' ? 'Préventive' : 'Corrective'}
                  </Badge>
                </td>
                <td className="p-3">{format(ot.date, 'dd/MM/yyyy')}</td>
                <td className="p-3 text-center">
                  {ot.status === 'Completed' ? (
                    <CheckCircle2 size={16} className="text-green-600 mx-auto" />
                  ) : (
                    <Clock size={16} className="text-amber-500 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer pour l'impression */}
      <div className="mt-10 pt-4 border-t text-xs text-gray-500 print:block hidden">
        <p>Document généré le {format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}. Fiche de vie complète de l'équipement {asset.id}.</p>
      </div>
    </div>
  );
};

export default AssetLifeSheet;