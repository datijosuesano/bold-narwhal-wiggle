import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale'; // Assuming French locale based on previous content
import { ChevronLeft, ChevronRight, Wrench, Factory, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- Types ---

interface ScheduledEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Maintenance Corrective' | 'Maintenance Préventive' | 'Inspection';
  priority: 'Low' | 'Medium' | 'High';
}

// --- Mock Data ---

const mockEvents: ScheduledEvent[] = [
  { id: 'E1', title: 'Remplacement filtre P-101', date: new Date(2024, 8, 10), type: 'Maintenance Préventive', priority: 'Medium' },
  { id: 'E2', title: 'Réparation fuite Zone C', date: new Date(2024, 8, 15), type: 'Maintenance Corrective', priority: 'High' },
  { id: 'E3', title: 'Inspection trimestrielle V12', date: new Date(2024, 8, 22), type: 'Inspection', priority: 'Low' },
  { id: 'E4', title: 'Calibration Ligne A', date: new Date(2024, 9, 5), type: 'Maintenance Préventive', priority: 'Medium' },
  { id: 'E5', title: 'Contrôle sécurité Entrepôt', date: new Date(2024, 9, 18), type: 'Inspection', priority: 'Low' },
];

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

// --- Component ---

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }); // Start week on Monday
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const eventsInMonth = useMemo(() => {
    // Note: In a real app, this would fetch data based on the current month range
    // For the demo, we filter the mock data
    return mockEvents.filter(event => isSameMonth(event.date, currentDate) || isSameMonth(event.date, subMonths(currentDate, 1)) || isSameMonth(event.date, addMonths(currentDate, 1)));
  }, [currentDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderDay = (day: Date) => {
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isToday = isSameDay(day, today);
    
    const dayEvents = eventsInMonth.filter(event => isSameDay(event.date, day));

    return (
      <div
        key={day.toISOString()}
        className={cn(
          "h-32 p-1 border border-border/50 relative overflow-hidden transition-colors",
          isCurrentMonth ? "bg-card" : "bg-muted/30 text-muted-foreground",
          isToday && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-background",
        )}
      >
        <div className={cn(
          "text-sm font-semibold text-right p-1 rounded-full inline-block",
          isToday ? "bg-blue-500 text-white" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"
        )}>
          {format(day, 'd')}
        </div>
        
        <div className="mt-1 space-y-0.5 overflow-y-auto max-h-[75%]">
          {dayEvents.map(event => (
            <div 
              key={event.id}
              className={cn(
                "text-xs text-white px-1 py-0.5 rounded-md truncate cursor-pointer shadow-sm",
                getEventStyle(event.type)
              )}
              title={event.title}
            >
              <div className="flex items-center">
                {getEventIcon(event.type)}
                {event.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
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
  );
};

export default CalendarView;