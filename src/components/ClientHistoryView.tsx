import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Wrench, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Intervention {
  id: string;
  title: string;
  date: Date;
  status: 'Terminé' | 'En cours' | 'Planifié';
  type: 'Préventif' | 'Curatif';
}

const mockInterventions: Intervention[] = [
  { id: 'OT-1024', title: 'Maintenance Préventive Autoclave', date: new Date('2024-02-15'), status: 'Terminé', type: 'Préventif' },
  { id: 'OT-1035', title: 'Réparation Scialytique Bloc 2', date: new Date('2024-03-01'), status: 'Terminé', type: 'Curatif' },
  { id: 'OT-1048', title: 'Calibration IRM Siemens', date: new Date('2024-03-10'), status: 'Planifié', type: 'Préventif' },
];

interface ClientHistoryViewProps {
  clientName: string;
}

const ClientHistoryView: React.FC<ClientHistoryViewProps> = ({ clientName }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <Wrench size={20} className="text-blue-600" /> 
        Historique pour {clientName}
      </h3>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {mockInterventions.map((item) => (
          <div key={item.id} className="p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-2 rounded-lg",
                item.type === 'Préventif' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
              )}>
                {item.type === 'Préventif' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(item.date, 'dd MMMM yyyy', { locale: fr })} • {item.id}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
               <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  item.status === 'Terminé' ? "bg-green-50 text-green-700 border-green-200" : 
                  item.status === 'En cours' ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-blue-50 text-blue-700 border-blue-200"
               )}>
                 {item.status}
               </span>
               <span className="text-[10px] text-muted-foreground italic">{item.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientHistoryView;