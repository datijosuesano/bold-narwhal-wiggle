import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, AlertCircle, Factory, Clock, TrendingUp, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';

interface ScheduledEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Maintenance Corrective' | 'Maintenance Préventive' | 'Inspection';
  priority: 'Low' | 'Medium' | 'High';
}

interface PlanningStatsProps {
  events: ScheduledEvent[];
}

const getAlertStatus = (date: Date): 'Urgent' | 'Warning' | 'Normal' => {
  const today = new Date();
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

const PlanningStats: React.FC<PlanningStatsProps> = ({ events }) => {
  const totalEvents = events.length;
  
  const stats = events.reduce((acc, event) => {
    const status = getAlertStatus(event.date);
    
    if (status === 'Urgent') {
      acc.urgentCount += 1;
    } else if (status === 'Warning') {
      acc.warningCount += 1;
    }

    if (event.type === 'Maintenance Préventive') {
      acc.preventiveCount += 1;
    } else if (event.type === 'Maintenance Corrective') {
      acc.correctiveCount += 1;
    } else if (event.type === 'Inspection') {
      acc.inspectionCount += 1;
    }
    
    return acc;
  }, {
    urgentCount: 0,
    warningCount: 0,
    preventiveCount: 0,
    correctiveCount: 0,
    inspectionCount: 0,
  });

  const kpiData = [
    { 
      label: 'Total Actions Planifiées', 
      value: totalEvents, 
      icon: <CalendarCheck className="text-blue-600" />, 
      color: 'border-blue-500' 
    },
    { 
      label: 'Actions Urgentes (Retard)', 
      value: stats.urgentCount, 
      icon: <AlertCircle className="text-red-500" />, 
      color: 'border-red-500' 
    },
    { 
      label: 'Maintenance Préventive', 
      value: stats.preventiveCount, 
      icon: <Wrench className="text-green-500" />, 
      color: 'border-green-500' 
    },
    { 
      label: 'Maintenance Corrective', 
      value: stats.correctiveCount, 
      icon: <Clock className="text-amber-500" />, 
      color: 'border-amber-500' 
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi, i) => (
        <Card key={i} className={cn("shadow-lg transition-transform hover:scale-[1.02] border-l-4", kpi.color)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </CardTitle>
            <div className="p-2 bg-accent rounded-full">{kpi.icon}</div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PlanningStats;