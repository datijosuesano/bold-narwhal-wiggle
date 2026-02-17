import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale'; 
import { ChevronLeft, ChevronRight, Wrench, Factory, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DayEventsDialog from './DayEventsDialog'; 

interface ScheduledEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Maintenance Corrective' | 'Maintenance Préventive' | 'Inspection';
  priority: 'Low' | 'Medium' | 'High';
  isCompleted: boolean;
  completionDate?: Date;
}

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
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysDifference = differenceInDays(dateOnly, todayOnly);

  if (daysDifference < 0) return 'Urgent';
  if (daysDifference <= 3) return 'Warning';
  return 'Normal';
};

interface CalendarViewProps {
  events: ScheduledEvent[];
  onCompleteEvent: (eventId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, onCompleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const today = new Date();

  // Paramètres de la grille
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }); // Lundi
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 }); // Dimanche

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const eventsInView = useMemo(() => {
    return events.filter(event => event.date >= startDate && event.date <= endDate);
  }, [events, startDate, endDate]);

  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return events.filter(event => isSameDay(event.date, selectedDay));
  }, [events, selectedDay]);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="bg-card rounded-xl shadow-xl p-6 border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-primary capitalize tracking-tight">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={goToToday} className="rounded-xl font-bold">
              Aujourd'hui
            </Button>
            <div className="flex border rounded-xl overflow-hidden">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="rounded-none border-r">
                <ChevronLeft size={18} />
              </Button>
              <Button variant="ghost" size="icon" onClick={goToNextMonth} className="rounded-none">
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </div>

        {/* En-tête des jours de la semaine */}
        <div className="grid grid-cols-7 text-center text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-px bg-muted border rounded-lg overflow-hidden">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, today);
            const currentDayEvents = eventsInView.filter(event => isSameDay(event.date, day));

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "h-32 p-2 relative transition-colors cursor-pointer group",
                  isCurrentMonth ? "bg-card hover:bg-accent/30" : "bg-muted/50 text-muted-foreground/40",
                )}
                onClick={() => handleDayClick(day)}
              >
                <div className={cn(
                  "text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full mb-1 transition-all",
                  isToday ? "bg-blue-600 text-white shadow-md scale-110" : isCurrentMonth ? "text-foreground" : "text-muted-foreground/30"
                )}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1 overflow-y-auto max-h-[70%] custom-scrollbar">
                  {currentDayEvents.map(event => {
                    let alertClasses = getEventStyle(event.type);
                    let alertIcon = getEventIcon(event.type);

                    if (event.isCompleted) {
                      alertClasses = 'bg-slate-400 opacity-60 line-through';
                    } else {
                      const status = getAlertStatus(event.date);
                      if (status === 'Urgent') alertClasses = 'bg-red-600 animate-pulse';
                      else if (status === 'Warning') alertClasses = 'bg-amber-500';
                    }

                    return (
                      <div 
                        key={event.id}
                        className={cn(
                          "text-[10px] text-white px-1.5 py-0.5 rounded shadow-sm truncate flex items-center font-medium",
                          alertClasses
                        )}
                      >
                        {alertIcon}
                        {event.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <DayEventsDialog 
        selectedDate={selectedDay}
        events={dayEvents}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCompleteEvent={onCompleteEvent}
      />
    </>
  );
};

export default CalendarView;