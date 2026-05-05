import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wrench, Clock, AlertTriangle, CheckCircle2, Hammer, Factory, ClipboardList, FileText, Calendar } from 'lucide-react';
import { Technician } from './TechniciansTable';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  title: string;
  date: string;
  type: 'OT' | 'Intervention';
  status?: string;
}

interface Equipment {
  id: string;
  name: string;
  type: 'Asset' | 'Tool';
}

interface TechnicianTasksDialogProps {
  technician: Technician | null;
  isOpen: boolean;
  onClose: () => void;
}

const TechnicianTasksDialog: React.FC<TechnicianTasksDialogProps> = ({ technician, isOpen, onClose }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!technician) return;
      setIsLoading(true);
      
      // 1. Matériel assigné
      const { data: assets } = await supabase.from('assets').select('id, name').eq('assigned_to', technician.id);
      const { data: tools } = await supabase.from('tools').select('id, name').eq('assigned_to', technician.id);
      
      const combinedEquip: Equipment[] = [
        ...(assets?.map(a => ({ id: a.id, name: a.name, type: 'Asset' as const })) || []),
        ...(tools?.map(t => ({ id: t.id, name: t.name, type: 'Tool' as const })) || [])
      ];
      setEquipment(combinedEquip);

      // 2. Activité enregistrée (Tâches créées par lui)
      const { data: ots } = await supabase
        .from('work_orders')
        .select('id, title, created_at, status')
        .eq('user_id', technician.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: interventions } = await supabase
        .from('interventions')
        .select('id, title, created_at')
        .eq('user_id', technician.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const combinedActivity: Activity[] = [
        ...(ots?.map(ot => ({ id: ot.id, title: ot.title, date: ot.created_at, type: 'OT' as const, status: ot.status })) || []),
        ...(interventions?.map(i => ({ id: i.id, title: i.title, date: i.created_at, type: 'Intervention' as const })) || [])
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setActivities(combinedActivity);
      setIsLoading(false);
    };

    if (isOpen) fetchData();
  }, [technician, isOpen]);

  if (!technician) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Fiche de {technician.name}</DialogTitle>
          <DialogDescription>Suivi des activités et du matériel détenu.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="activity" className="mt-4 flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full bg-muted">
            <TabsTrigger value="activity" className="flex-1">Journal d'Activité</TabsTrigger>
            <TabsTrigger value="equipment" className="flex-1">Matériel ({equipment.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
             {isLoading ? (
               <div className="py-10 text-center animate-pulse">Chargement de l'activité...</div>
             ) : activities.length > 0 ? (
               <div className="space-y-3">
                 <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">Dernières saisies enregistrées</h4>
                 {activities.map((act) => (
                   <div key={act.id} className="p-3 border rounded-xl bg-card flex items-center justify-between group hover:border-blue-400 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className={cn(
                         "p-2 rounded-lg",
                         act.type === 'OT' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                       )}>
                         {act.type === 'OT' ? <ClipboardList size={16} /> : <Wrench size={16} />}
                       </div>
                       <div>
                         <p className="font-bold text-sm leading-tight">{act.title}</p>
                         <div className="flex items-center gap-2 mt-1">
                           <Badge variant="outline" className="text-[8px] uppercase px-1 h-4">{act.type}</Badge>
                           <span className="text-[10px] text-muted-foreground flex items-center">
                             <Calendar size={10} className="mr-1" /> {format(new Date(act.date), 'dd/MM/yy HH:mm', { locale: fr })}
                           </span>
                         </div>
                       </div>
                     </div>
                     {act.status && (
                       <Badge className="text-[9px] rounded-full">{act.status}</Badge>
                     )}
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
                  <FileText className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Aucune tâche enregistrée par cet utilisateur.</p>
               </div>
             )}
          </TabsContent>

          <TabsContent value="equipment" className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
            {isLoading ? (
              <div className="py-10 text-center animate-pulse">Chargement de l'inventaire...</div>
            ) : equipment.length > 0 ? (
              <div className="space-y-2">
                {equipment.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-xl bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", item.type === 'Asset' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600")}>
                        {item.type === 'Asset' ? <Factory size={18} /> : <Hammer size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.type === 'Asset' ? 'Équipement médical' : 'Outillage'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">{item.id.substring(0, 8)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
                <Hammer className="mx-auto h-12 w-12 opacity-10 mb-2" />
                <p className="text-sm text-muted-foreground">Aucun matériel assigné.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TechnicianTasksDialog;