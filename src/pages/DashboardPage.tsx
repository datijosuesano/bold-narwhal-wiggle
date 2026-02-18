import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Factory, AlertTriangle, FlaskConical, Clock, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    overdueOrders: 0,
    brokenAssets: 0,
    criticalReagents: 0,
    ordersByPriority: { Critique: 0, Élevée: 0, Moyenne: 0, Faible: 0 },
    interventionsByTech: [] as { name: string, count: number }[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setIsLoading(true);
      
      const today = new Date().toISOString().split('T')[0];

      try {
        // 1. Work orders en retard
        const { count: overdue } = await supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .lt('due_date', today)
          .neq('status', 'Terminé');

        // 2. Assets non-opérationnels
        const { count: broken } = await supabase
          .from('assets')
          .select('*', { count: 'exact', head: true })
          .neq('status', 'Opérationnel');

        // 3. Réactifs en stock critique
        const { data: reagents } = await supabase
          .from('lab_reagents')
          .select('current_stock, min_stock');
        const critical = reagents?.filter(r => r.current_stock <= r.min_stock).length || 0;

        // 4. Work orders par priorité
        const { data: priorities } = await supabase
          .from('work_orders')
          .select('priority');
        
        const priorityCounts = (priorities || []).reduce((acc: any, curr) => {
          acc[curr.priority] = (acc[curr.priority] || 0) + 1;
          return acc;
        }, { Critique: 0, Élevée: 0, Moyenne: 0, Faible: 0 });

        setStats({
          overdueOrders: overdue || 0,
          brokenAssets: broken || 0,
          criticalReagents: critical,
          ordersByPriority: priorityCounts,
          interventionsByTech: [] // À implémenter avec une jointure si nécessaire
        });
      } catch (error) {
        console.error("Erreur Dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const kpis = [
    {
      title: "OT en Retard",
      value: stats.overdueOrders,
      icon: <Clock className="h-5 w-5 text-red-600" />,
      color: "border-l-red-600",
      path: "/work-orders",
      description: "Échéance dépassée et non clôturés"
    },
    {
      title: "Équipements HS",
      value: stats.brokenAssets,
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      color: "border-l-amber-500",
      path: "/assets",
      description: "Statut différent de 'Opérationnel'"
    },
    {
      title: "Stocks Critiques",
      value: stats.criticalReagents,
      icon: <FlaskConical className="h-5 w-5 text-purple-500" />,
      color: "border-l-purple-500",
      path: "/reagents",
      description: "Réactifs sous le seuil d'alerte"
    },
    {
      title: "Priorité Critique",
      value: stats.ordersByPriority.Critique,
      icon: <TrendingUp className="h-5 w-5 text-red-800" />,
      color: "border-l-red-900",
      path: "/work-orders",
      description: "Demandes urgentes à traiter"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">GMAO BIOMÉDICALE</h1>
          <p className="text-lg text-muted-foreground">État du parc et des opérations au {format(new Date(), 'dd MMMM yyyy', { locale: import('date-fns/locale').then(m => m.fr) as any })}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card 
            key={index} 
            className={cn(
              "shadow-lg border-l-4 cursor-pointer transition-all hover:scale-[1.02] active:scale-95", 
              kpi.color
            )}
            onClick={() => navigate(kpi.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase text-muted-foreground">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{kpi.value}</div>
              <p className="text-[10px] text-muted-foreground mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-xl border-none bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench size={20} className="text-blue-400" /> Distribution des Priorités
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.ordersByPriority).map(([label, count]) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>{label}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all",
                      label === 'Critique' ? 'bg-red-600' : label === 'Élevée' ? 'bg-amber-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${(count / (Object.values(stats.ordersByPriority).reduce((a, b) => a + b, 0) || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-xl border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} className="text-blue-600" /> Actions Rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button onClick={() => navigate('/work-orders')} className="h-20 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 border-none flex flex-col gap-1">
              <ClipboardList size={24} />
              <span className="text-xs font-bold">Nouvel OT</span>
            </Button>
            <Button onClick={() => navigate('/interventions')} className="h-20 rounded-2xl bg-green-50 text-green-700 hover:bg-green-100 border-none flex flex-col gap-1">
              <Wrench size={24} />
              <span className="text-xs font-bold">Saisir Rapport</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;