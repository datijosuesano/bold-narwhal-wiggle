import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Clock, TrendingUp, Zap, CalendarDays, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFMDPerformance } from '@/hooks/use-fmd-performance';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PerformanceDashboardProps {
  assetId?: string;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ assetId }) => {
  const [periodDays, setPeriodDays] = useState(30);
  const { metrics, isLoading, error, fetchBreakdownEvents } = useFMDPerformance(assetId, periodDays);

  const kpiData = [
    { 
      label: 'MTTR (Temps de Réparation)', 
      value: metrics.mttr, 
      unit: 'h', 
      icon: <Clock className="text-red-500" />, 
      color: 'border-red-500',
      description: 'Temps moyen pour réparer une panne.',
    },
    { 
      label: 'MTBF (Temps de Bon Fonctionnement)', 
      value: metrics.mtbf, 
      unit: 'h', 
      icon: <TrendingUp className="text-green-500" />, 
      color: 'border-green-500',
      description: 'Temps moyen entre deux pannes.',
    },
    { 
      label: 'Disponibilité', 
      value: metrics.availability, 
      unit: '%', 
      icon: <Zap className="text-blue-500" />, 
      color: 'border-blue-500',
      description: 'Taux d\'opérationnalité de l\'équipement.',
    },
    { 
      label: 'Pannes Enregistrées', 
      value: metrics.totalBreakdowns, 
      unit: '', 
      icon: <Wrench className="text-amber-500" />, 
      color: 'border-amber-500',
      description: `Nombre de pannes sur les ${periodDays} derniers jours.`,
    },
  ];

  const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setPeriodDays(value);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg p-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
        <p className="text-sm mt-2 text-muted-foreground">Calcul des indicateurs FMD...</p>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="shadow-lg p-6 border-amber-200 bg-amber-50">
        <div className="flex items-center gap-3 text-amber-800">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-bold">Indicateurs de performance indisponibles</p>
            <p className="text-xs">La table 'breakdown_events' est manquante. Veuillez l'ajouter dans Supabase pour voir les stats.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary flex items-center">
          <TrendingUp className="mr-2 h-6 w-6" /> Indicateurs de Performance FMD
        </h2>
        <div className="flex items-center space-x-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Input 
            type="number" 
            value={periodDays} 
            onChange={handlePeriodChange} 
            className="w-20 rounded-xl text-center"
            min="1"
          />
          <span className="text-sm text-muted-foreground">jours</span>
          <Button variant="outline" size="sm" onClick={fetchBreakdownEvents} className="rounded-xl">
            Actualiser
          </Button>
        </div>
      </div>

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
              <div className="text-3xl font-bold">
                {kpi.value}
                <span className="text-lg font-normal ml-1 text-muted-foreground">{kpi.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PerformanceDashboard;