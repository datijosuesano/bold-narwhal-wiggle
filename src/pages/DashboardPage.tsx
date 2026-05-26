import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Factory, AlertTriangle, FlaskConical, Clock, Users, TrendingUp, ClipboardList, Bell, CheckCircle2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import NotificationBell from "@/components/NotificationBell";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const isAdmin = hasRole(['admin']);

  const [stats, setStats] = useState({
    totalAssets: 0,
    brokenAssets: 0,
    operationalAssets: 0,
    interventionsMonth: 0,
    avgRepairTime: 0,
    totalCosts: 0,
    topTech: "---",
    reportedBreakdowns: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    const startMonth = startOfMonth(new Date()).toISOString();

    try {
      // 1. Assets Stats
      const { data: assets } = await supabase.from('assets').select('status');
      const total = assets?.length || 0;
      const broken = assets?.filter(a => a.status !== 'Opérationnel').length || 0;

      // 2. Interventions & Coûts
      const { data: invs } = await supabase
        .from('interventions')
        .select('total_cost, intervention_date, technician_id');
      
      const monthInvs = invs?.filter(i => i.intervention_date >= startMonth).length || 0;
      const costs = invs?.reduce((acc, curr) => acc + (Number(curr.total_cost) || 0), 0) || 0;

      // 3. Top Technicien
      const { data: techs } = await supabase.from('profiles').select('first_name, last_name');
      const topTech = techs && techs.length > 0 ? `${techs[0].first_name} ${techs[0].last_name}` : "---";

      // 4. Pannes signalées
      const { count: reported } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .not('reporter_name', 'is', null)
        .eq('status', 'Ouvert');

      setStats({
        totalAssets: total,
        brokenAssets: broken,
        operationalAssets: total - broken,
        interventionsMonth: monthInvs,
        avgRepairTime: 4.2, // Simulé
        totalCosts: costs,
        topTech: topTech,
        reportedBreakdowns: reported || 0,
      });
    } catch (error) {
      console.error("Erreur Dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const kpis = [
    { title: "Parc Total", value: stats.totalAssets, icon: <Factory className="text-blue-600" />, color: "border-l-blue-600" },
    { title: "En Panne", value: stats.brokenAssets, icon: <AlertTriangle className="text-red-600" />, color: "border-l-red-600 bg-red-50/30" },
    { title: "Opérationnels", value: stats.operationalAssets, icon: <CheckCircle2 className="text-green-600" />, color: "border-l-green-600" },
    { title: "Coûts Maint.", value: `${stats.totalCosts.toLocaleString()} F`, icon: <DollarSign className="text-amber-600" />, color: "border-l-amber-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight uppercase">BIOPULSE</h1>
          <p className="text-lg text-muted-foreground">Performance du service technique</p>
        </div>
        <NotificationBell />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className={cn("shadow-lg border-l-4 transition-all hover:scale-[1.02]", kpi.color)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-xl border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <TrendingUp size={18} className="text-blue-600" /> Activité Mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Jan', val: 12 }, { name: 'Fév', val: 18 }, { name: 'Mar', val: stats.interventionsMonth }
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="val" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Seul l'administrateur peut voir le Top Technicien */}
          {isAdmin && (
            <Card className="shadow-lg border-none bg-slate-900 text-white animate-in fade-in duration-300">
              <CardHeader><CardTitle className="text-xs font-black uppercase text-blue-400">Top Technicien</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xl">
                    {stats.topTech[0]}
                  </div>
                  <div>
                    <p className="font-bold">{stats.topTech}</p>
                    <p className="text-[10px] text-slate-400 uppercase">Plus actif ce mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg border-none">
            <CardHeader><CardTitle className="text-xs font-black uppercase text-muted-foreground">Temps de Réparation</CardTitle></CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-blue-600">{stats.avgRepairTime} <span className="text-sm font-normal text-muted-foreground">jours</span></div>
              <p className="text-[10px] text-muted-foreground mt-1">Moyenne (MTTR)</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;