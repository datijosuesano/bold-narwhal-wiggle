import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale'; 
import { ChevronLeft, ChevronRight, Wrench, Factory, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DayEventsDialog from './DayEventsDialog'; // Import du nouveau composant

// --- Types ---

interface ScheduledEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Maintenance Corrective' | 'Maintenance Préventive' | 'Inspection';
  priority: 'Low' | 'Medium' | 'High';
}

// --- Utility Functions ---

const getEventStyle = (type: ScheduledEvent['type']) => {
  switch (type) {
    case 'Maintenance Corrective': return 'bg-red-500 hover:bg-red-600';
    case 'Maintenance Préventive': return 'bg-blue-600 hover:bg-blue-700';
    case 'Inspection': return 'bg-green-600 hover:bg-green-700';
    default: return 'bg-gray-500 hover:bg-gray-600';
  }
};

const getEventIcon = (type: ScheduledEvent['type']) => {
  switch (type) {
    case 'Maintenance Corrective': return <AlertCircle size={12} className="mr-1" />;
    case 'Maintenance Préventive': return <Wrench size={12} className="mr-1" />;
    case 'Inspection': return <Factory size={12} className="mr-1" />;
    default: return null;
  }
};

const getAlertStatus = (date: Date): 'Urgent' | 'Warning' | 'Normal' => {
  const today = new Date();
  // Pour comparer uniquement les dates, on met l'heure à minuit
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const daysDifference = differenceInDays(dateOnly, todayOnly);

  if (daysDifference < 0) {
    return 'Urgent'; // Dépassé
  }
  if (daysDifference <= 3) {
    return 'Warning'; // Proche (dans les 3 jours)
  }
  return 'Normal'; // Futur
};

interface CalendarViewProps {
  events: ScheduledEvent[];
}

// --- Component ---

const CalendarView: React.FC<CalendarViewProps> = ({ events }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const today = new Date();

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }); // Start week on Monday
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const eventsInView = useMemo(() => {
    // Filter events to include only those visible in the current calendar view range
    return events.filter(event => event.date >= startDate && event.date <= endDate);
  }, [events, startDate, endDate]);

  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return events.filter(event => isSameDay(event.date, selectedDay));
  }, [events, selectedDay]);

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setIsDialogOpen(true);
  };

  const renderDay = (day: Date) => {
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isToday = isSameDay(day, today);
    
    const dayEvents = eventsInView.filter(event => isSameDay(event.date, day));

    return (
      <div
        key={day.toISOString()}
        className={cn(
          "h-32 p-1 border border-border/50 relative overflow-hidden transition-colors cursor-pointer",
          isCurrentMonth ? "bg-card hover:bg-accent/50" : "bg-muted/30 text-muted-foreground hover:bg-muted/50",
          isToday && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-background",
        )}
        onClick={() => handleDayClick(day)}
      >
        <div className={cn(
          "text-sm font-semibold text-right p-1 rounded-full inline-block",
          isToday ? "bg-blue-500 text-white" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"
        )}>
          {format(day, 'd')}
        </div>
        
        <div className="mt-1 space-y-0.5 overflow-y-auto max-h-[75%]">
          {dayEvents.map(event => {
            const alertStatus = getAlertStatus(event.date);
            
            let alertClasses = '';
            let alertIcon = getEventIcon(event.type);

            if (alertStatus === 'Urgent') {
              alertClasses = 'bg-red-700 hover:bg-red-800 ring-1 ring-red-400';
              alertIcon = <Clock size={12} className="mr-1 text-white" />; // Icône d'urgence
            } else if (alertStatus === 'Warning') {
              alertClasses = 'bg-amber-500 hover:bg-amber-600 ring-1 ring-amber-300';
            } else {
              alertClasses = getEventStyle(event.type);
            }

            return (
              <div 
                key={event.id}
                className={cn(
                  "text-xs text-white px-1 py-0.5 rounded-md truncate cursor-pointer shadow-sm",
                  alertClasses
                )}
                title={event.title}
                // Empêche la propagation du clic pour ne pas ouvrir la modale du jour si on clique sur l'événement
                onClick={(e) => e.stopPropagation()} 
              >
                <div className="flex items-center">
                  {alertIcon}
                  {event.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-card rounded-xl shadow-xl p-6">
        {/* Header de navigation */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={goToToday} className="rounded-xl">
              Aujourd'hui
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="rounded-xl">
              <ChevronLeft size={18} />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextMonth} className="rounded-xl">
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground border-b border-border/50 mb-1">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-px border-t border-border/50">
          {days.map(renderDay)}
        </div>
      </div>
      
      {/* Modale des événements du jour */}
      <DayEventsDialog 
        selectedDate={selectedDay}
        events={dayEvents}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
};

export default CalendarView;