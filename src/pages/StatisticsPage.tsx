import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Clock, CheckCircle2, AlertTriangle, Loader2, Calendar, BarChart3, PieChart, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePie, Pie } from 'recharts';

const StatisticsPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    avgReactionTime: 0,
    completionRate: 0,
    totalInterventions: 0,
    totalOTs: 0,
    bySite: [] as any[],
    byType: [] as any[],
  });

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // 1. Récupérer les OTs et les Interventions
      const { data: ots } = await supabase.from('work_orders').select('created_at, status, asset_id');
      const { data: interventions } = await supabase.from('interventions').select('intervention_date, created_at, maintenance_type, assets(location)');

      if (!ots || !interventions) return;

      // 2. Calcul du temps de réaction moyen (Délai entre création OT et date Intervention)
      // Note: Dans une GMAO réelle, on lierait l'OT à l'Intervention via une clé étrangère.
      // Ici, on simule le calcul sur les interventions terminées.
      let totalDays = 0;
      let count = 0;

      interventions.forEach(inv => {
        const start = new Date(inv.created_at);
        const end = new Date(inv.intervention_date);
        const diff = differenceInDays(end, start);
        if (diff >= 0) {
          totalDays += diff;
          count++;
        }
      });

      const avgReaction = count > 0 ? (totalDays / count).toFixed(1) : 0;

      // 3. Taux de complétion
      const completed = ots.filter(ot => ot.status === 'Terminé').length;
      const rate = ots.length > 0 ? Math.round((completed / ots.length) * 100) : 0;

      // 4. Répartition par site
      const siteMap = new Map();
      interventions.forEach(inv => {
        const site = inv.assets?.location || "Inconnu";
        siteMap.set(site, (siteMap.get(site) || 0) + 1);
      });
      const bySite = Array.from(siteMap.entries()).map(([name, value]) => ({ name, value }));

      // 5. Répartition par type
      const typeMap = new Map();
      interventions.forEach(inv => {
        const type = inv.maintenance_type;
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
      });
      const byType = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));

      setStats({
        avgReactionTime: Number(avgReaction),
        completionRate: rate,
        totalInterventions: interventions.length,
        totalOTs: ots.length,
        bySite,
        byType
      });
    } catch (error) {
      console.error("Erreur stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-muted-foreground font-medium">Analyse des données en cours...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-100 rounded-2xl">
          <TrendingUp className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">Analyses & Performance</h1>
          <p className="text-lg text-muted-foreground">Indicateurs de qualité du service technique.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg border-l-4 border-blue-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center">
              <Clock size={14} className="mr-2" /> Temps de Réaction Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">{stats.avgReactionTime} <span className="text-sm font-normal text-muted-foreground">jours</span></div>
            <p className="text-[10px] text-muted-foreground mt-1">Délai moyen de prise en charge</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center">
              <CheckCircle2 size={14} className="mr-2" /> Taux de Résolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">{stats.completionRate}%</div>
            <p className="text-[10px] text-muted-foreground mt-1">OT clôturés / OT ouverts</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center">
              <BarChart3 size={14} className="mr-2" /> Volume d'Activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-600">{stats.totalInterventions}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Interventions réalisées au total</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center">
              <AlertTriangle size={14} className="mr-2" /> Charge de Travail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{stats.totalOTs}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Ordres de travail émis</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-xl border-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin size={20} className="text-blue-600" /> Interventions par Site
            </CardTitle>
            <CardDescription>Volume de maintenance par établissement.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.bySite} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {stats.bySite.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-none">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChart size={20} className="text-purple-600" /> Mix de Maintenance
            </CardTitle>
            <CardDescription>Répartition Préventif vs Curatif.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie
                  data={stats.byType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RePie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsPage;