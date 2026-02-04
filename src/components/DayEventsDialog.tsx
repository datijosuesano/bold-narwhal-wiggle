import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, AlertCircle, Factory, Clock, CalendarCheck, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ScheduledEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Maintenance Corrective' | 'Maintenance Préventive' | 'Inspection';
  priority: 'Low' | 'Medium' | 'High';
  isCompleted: boolean;
}

interface DayEventsDialogProps {
  selectedDate: Date | null;
  events: ScheduledEvent[];
  isOpen: boolean;
  onClose: () => void;
  onCompleteEvent: (eventId: string) => void; // Nouveau prop
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

const DayEventsDialog: React.FC<DayEventsDialogProps> = ({ selectedDate, events, isOpen, onClose, onCompleteEvent }) => {
  if (!selectedDate) return null;

  const formattedDate = format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr });

  const handleComplete = (eventId: string) => {
    onCompleteEvent(eventId);
    // Optionnel: Fermer la modale ou rafraîchir la liste si nécessaire
  };

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
              <Card 
                key={event.id} 
                className={cn(
                  "shadow-sm transition-shadow border-l-4",
                  event.isCompleted ? "border-gray-400 bg-gray-50/50 dark:bg-gray-900/50" : "hover:shadow-md border-primary/50"
                )}
              >
                <CardContent className="p-4 flex items-center justify-between space-x-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="pt-1">
                      {event.isCompleted ? <CheckCircle size={18} className="text-gray-500" /> : getEventIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className={cn("font-semibold text-lg leading-tight", event.isCompleted && "line-through text-muted-foreground")}>
                        {event.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Type: {event.type.replace('Maintenance ', '')}
                      </p>
                      <span className={cn(
                        "mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        getPriorityColor(event.priority),
                        event.isCompleted && "opacity-50"
                      )}>
                        <Clock size={10} className="mr-1" /> Priorité {event.priority}
                      </span>
                    </div>
                  </div>
                  
                  {!event.isCompleted && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="rounded-xl bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => handleComplete(event.id)}
                    >
                      <CheckCircle size={16} className="mr-2" /> Terminer
                    </Button>
                  )}
                  {event.isCompleted && (
                    <span className="text-sm text-gray-500 font-medium">Terminé</span>
                  )}
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