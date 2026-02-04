import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, AlertCircle, Factory, Clock, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduledEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Maintenance Corrective' | 'Maintenance Préventive' | 'Inspection';
  priority: 'Low' | 'Medium' | 'High';
}

interface DayEventsDialogProps {
  selectedDate: Date | null;
  events: ScheduledEvent[];
  isOpen: boolean;
  onClose: () => void;
}

const getEventIcon = (type: ScheduledEvent['type']) => {
  switch (type) {
    case 'Maintenance Corrective': return <AlertCircle size={18} className="text-red-500" />;
    case 'Maintenance Préventive': return <Wrench size={18} className="text-blue-500" />;
    case 'Inspection': return <Factory size={18} className="text-green-500" />;
    default: return <CalendarCheck size={18} className="text-gray-500" />;
  }
};

const getPriorityColor = (priority: ScheduledEvent['priority']) => {
  switch (priority) {
    case 'High': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    case 'Medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    case 'Low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700/30';
  }
};

const DayEventsDialog: React.FC<DayEventsDialogProps> = ({ selectedDate, events, isOpen, onClose }) => {
  if (!selectedDate) return null;

  const formattedDate = format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Actions du {formattedDate}
          </DialogTitle>
          <DialogDescription>
            {events.length} tâche(s) de maintenance planifiée(s) pour cette journée.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {events.length > 0 ? (
            events.map((event) => (
              <Card key={event.id} className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-primary/50">
                <CardContent className="p-4 flex items-start space-x-4">
                  <div className="pt-1">{getEventIcon(event.type)}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg leading-tight">{event.title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Type: {event.type.replace('Maintenance ', '')}
                    </p>
                    <span className={cn(
                      "mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      getPriorityColor(event.priority)
                    )}>
                      <Clock size={10} className="mr-1" /> Priorité {event.priority}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              Aucune action planifiée pour cette date.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DayEventsDialog;