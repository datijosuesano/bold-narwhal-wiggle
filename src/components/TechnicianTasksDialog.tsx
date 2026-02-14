import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wrench, Clock, AlertTriangle, CheckCircle2, Hammer, Factory } from 'lucide-react';
import { Technician } from './TechniciansTable';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Task {
  id: string;
  title: string;
  asset: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'InProgress' | 'Pending';
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!technician) return;
      setIsLoading(true);
      
      const { data: assets } = await supabase.from('assets').select('id, name').eq('assigned_to', technician.id);
      const { data: tools } = await supabase.from('tools').select('id, name').eq('assigned_to', technician.id);
      
      const combined: Equipment[] = [
        ...(assets?.map(a => ({ id: a.id, name: a.name, type: 'Asset' as const })) || []),
        ...(tools?.map(t => ({ id: t.id, name: t.name, type: 'Tool' as const })) || [])
      ];
      
      setEquipment(combined);
      setIsLoading(false);
    };

    if (isOpen) fetchEquipment();
  }, [technician, isOpen]);

  if (!technician) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Fiche de {technician.name}</DialogTitle>
          <DialogDescription>Suivi des activités et du matériel détenu.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tasks" className="mt-4">
          <TabsList className="w-full bg-muted">
            <TabsTrigger value="tasks" className="flex-1">Missions (OT)</TabsTrigger>
            <TabsTrigger value="equipment" className="flex-1">Matériel Détendu ({equipment.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4 mt-4">
             <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
                <Clock className="mx-auto mb-2 opacity-20" />
                Les ordres de travail en cours s'afficheront ici.
             </div>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground animate-pulse">Chargement de l'inventaire...</div>
            ) : equipment.length > 0 ? (
              equipment.map((item) => (
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
              ))
            ) : (
              <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed">
                <Hammer className="mx-auto h-12 w-12 opacity-10 mb-2" />
                <p className="text-sm text-muted-foreground">Aucun matériel assigné à ce technicien.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default TechnicianTasksDialog;