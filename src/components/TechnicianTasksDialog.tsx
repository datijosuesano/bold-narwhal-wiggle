import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wrench, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Technician } from './TechniciansTable';

interface Task {
  id: string;
  title: string;
  asset: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'InProgress' | 'Pending';
}

interface TechnicianTasksDialogProps {
  technician: Technician | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mock des tâches pour la démonstration
const mockTasks: Record<string, Task[]> = {
  'TECH-01': [
    { id: 'OT-102', title: 'Calibration IRM', asset: 'IRM Siemens', priority: 'High', status: 'InProgress' },
    { id: 'OT-105', title: 'Maintenance Respirateur', asset: 'Dräger V500', priority: 'Medium', status: 'Pending' },
    { id: 'OT-110', title: 'Réparation Pompe', asset: 'Pompe P-101', priority: 'High', status: 'InProgress' },
  ],
  'TECH-03': [
    { id: 'OT-201', title: 'Vérification Climatisation', asset: 'Bloc Opératoire 1', priority: 'Medium', status: 'InProgress' },
  ],
};

const TechnicianTasksDialog: React.FC<TechnicianTasksDialogProps> = ({ technician, isOpen, onClose }) => {
  if (!technician) return null;

  const tasks = mockTasks[technician.id] || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center">
            <Wrench className="mr-2 text-blue-600" />
            Tâches de {technician.name}
          </DialogTitle>
          <DialogDescription>
            {tasks.length} intervention(s) en cours ou planifiée(s).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} className="p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono text-muted-foreground">{task.id}</span>
                    <h4 className="font-bold text-foreground">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">{task.asset}</p>
                  </div>
                  <Badge className={cn(
                    "rounded-full",
                    task.priority === 'High' ? "bg-red-500" : task.priority === 'Medium' ? "bg-amber-500" : "bg-blue-500"
                  )}>
                    {task.priority === 'High' ? 'Urgent' : task.priority === 'Medium' ? 'Moyen' : 'Normal'}
                  </Badge>
                </div>
                <div className="flex items-center text-xs font-medium pt-2 border-t">
                  {task.status === 'InProgress' ? (
                    <span className="flex items-center text-amber-600">
                      <Clock size={14} className="mr-1 animate-pulse" /> En cours
                    </span>
                  ) : (
                    <span className="flex items-center text-blue-600">
                      <AlertTriangle size={14} className="mr-1" /> En attente
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl border-2 border-dashed">
              <CheckCircle2 className="mx-auto h-12 w-12 opacity-20 mb-2" />
              Aucune tâche assignée pour le moment.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function locally since we can't import cn from here easily if it's not exported
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default TechnicianTasksDialog;