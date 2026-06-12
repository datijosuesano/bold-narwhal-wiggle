import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Calendar, 
  BarChart3, 
  PieChart, 
  MapPin, 
  Warehouse,
  Activity,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { useStatistics } from '@/hooks/useStatistics';
import { useKpiCalculations } from '@/hooks/useKpiCalculations';
import { KPICard } from '@/components/KPICard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart as RePie, 
  Pie 
} from 'recharts';

// Couleurs centralisées pour les graphiques
const CHART_COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const StatisticsPage: React.FC = () => {
  const [periodDays, setPeriodDays] = useState<number>(30);
  
  // Récupération des données via le hook personnalisé
  const { workOrders, interventions, assets, isLoading, error, refetch } = useStatistics(periodDays);
  
  // Calculs des KPIs biomédicaux via le hook dédié
  const metrics = useKpiCalculations(workOrders, interventions, assets, periodDays);

  // Skeletons de chargement pour une UX fluide
  const renderSkeletons = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-xl" />
        </div>
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px] rounded-2xl" />
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    </div>
  );

  if (isLoading) {
    return renderSkeletons();
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 max-w-md mx-auto text-center">
        <div className="p-4 bg-red-50 text-red-600 rounded-full shadow-inner">
          <AlertTriangle size={48} />
        </div>
        <h2 className="text-xl font-black text-slate-900 uppercase">Erreur d'analyse</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
        <Button onClick={refetch} className="bg-blue-600 rounded-xl font-bold h-11 px-6">
          <RefreshCw size={16} className="mr-2" /> Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Analyses & Performance</h1>
            <p className="text-lg text-muted-foreground">Indicateurs de qualité et de fiabilité du service biomédical.</p>
          </div>
        </div>

        {/* FILTRE DE PÉRIODE */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="text-slate-400 shrink-0" size={18} />
          <Select
            value={String(periodDays)}
            onValueChange={(val) => setPeriodDays(Number(val))}
          >
            <SelectTrigger className="w-full sm:w-48 rounded-xl h-11 border-slate-200 bg-white font-bold text-xs">
              <SelectValue placeholder="Sélectionner la période" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
              <SelectItem value="180">180 derniers jours</SelectItem>
              <SelectItem value="365">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* GRILLE DES KPIS BIOMÉDICAUX */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Temps de Réaction Moyen"
          value={metrics.avgReactionTime}
          unit="jours"
          description="Délai moyen entre la création de l'OT et sa clôture."
          icon={<Clock size={18} />}
          borderColorClass="border-l-blue-600"
          iconBgClass="bg-blue-50 text-blue-600"
        />

        <KPICard 
          title="MTTR (Temps de Réparation)"
          value={metrics.mttr}
          unit="h"
          description="Temps moyen passé pour réparer un équipement en panne."
          icon={<Activity size={18} />}
          borderColorClass="border-l-red-500"
          iconBgClass="bg-red-50 text-red-500"
        />

        <KPICard 
          title="MTBF (Temps de Bon Fonctionnement)"
          value={metrics.mtbf}
          unit="h"
          description="Temps moyen de fonctionnement entre deux pannes."
          icon={<TrendingUp size={18} />}
          borderColorClass="border-l-green-500"
          iconBgClass="bg-green-50 text-green-500"
        />

        <KPICard 
          title="Disponibilité Globale"
          value={metrics.availability}
          unit="%"
          description="Taux d'opérationnalité moyen de l'ensemble du parc."
          icon={<CheckCircle2 size={18} />}
          borderColorClass="border-l-purple-600"
          iconBgClass="bg-purple-50 text-purple-600"
        />
      </div>

      {/* DEUXIÈME LIGNE DE KPIS SECONDAIRES */}
      <div className="grid gap-6 md:grid-cols-3 print:hidden">
        <Card className="shadow-md bg-white border-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Taux de Maintenance Préventive</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{metrics.preventiveRate}%</p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full font-bold">ISO 9001</Badge>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-white border-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Interventions Réalisées</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{metrics.totalInterventions}</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full font-bold">Activité</Badge>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-white border-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ordres de Travail Émis</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{metrics.totalOTs}</p>
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 rounded-full font-bold">Flux</Badge>
          </CardContent>
        </Card>
      </div>

      {/* GRAPHIQUES ANALYTIQUES */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* LOGISTIQUE D'INTERVENTION */}
        <Card className="shadow-xl border-none bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Warehouse size={20} className="text-purple-600" /> Logistique d'Intervention
            </CardTitle>
            <CardDescription>Répartition des travaux entre le Site et l'Atelier.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {metrics.byPlace.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePie>
                  <Pie
                    data={metrics.byPlace}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {metrics.byPlace.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePie>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 italic">Aucune donnée logistique disponible.</p>
            )}
          </CardContent>
        </Card>

        {/* MIX DE MAINTENANCE */}
        <Card className="shadow-xl border-none bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChart size={20} className="text-blue-600" /> Mix de Maintenance
            </CardTitle>
            <CardDescription>Répartition Préventif vs Correctif.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {metrics.byType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePie>
                  <Pie
                    data={metrics.byType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {metrics.byType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePie>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 italic">Aucune donnée de mix disponible.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ACTIVITÉ PAR ÉTABLISSEMENT */}
      <Card className="shadow-xl border-none bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" /> Activité par Établissement
          </CardTitle>
          <CardDescription>Nombre d'interventions réalisées par site partenaire.</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          {metrics.bySite.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.bySite} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={25}>
                  {metrics.bySite.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400 italic">
              Aucune intervention enregistrée sur cette période.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsPage;