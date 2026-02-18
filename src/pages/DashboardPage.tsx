import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Factory, Clock, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    openOrders: 0,
    brokenAssets: 0,
    totalAssets: 0,
    availability: 100
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setIsLoading(true);
      
      try {
        const { count: openOrders } = await supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .neq('status', 'Completed');

        const { count: brokenAssets } = await supabase
          .from('assets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'En Panne');

        const { count: totalAssets } = await supabase
          .from('assets')
          .select('*', { count: 'exact', head: true });

        setStats({
          openOrders: openOrders || 0,
          brokenAssets: brokenAssets || 0,
          totalAssets: totalAssets || 0,
          availability: totalAssets && totalAssets > 0 ? ((totalAssets - (brokenAssets || 0)) / totalAssets) * 100 : 100
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const kpis = [
    {
      title: "OT Ouverts",
      value: stats.openOrders,
      icon: <Wrench className="h-5 w-5 text-blue-500" />,
      color: "border-l-blue-500",
      path: "/work-orders",
      textColor: "text-foreground"
    },
    {
      title: "En Panne",
      value: stats.brokenAssets,
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      color: "border-l-red-500",
      path: "/assets",
      textColor: "text-red-600"
    },
    {
      title: "Total Actifs",
      value: stats.totalAssets,
      icon: <Factory className="h-5 w-5 text-amber-500" />,
      color: "border-l-amber-500",
      path: "/assets",
      textColor: "text-foreground"
    },
    {
      title: "Disponibilité",
      value: `${stats.availability.toFixed(1)}%`,
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
      color: "border-l-green-500",
      path: "/reports",
      textColor: "text-foreground"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-primary tracking-tight">Tableau de Bord</h1>
        <p className="text-lg text-muted-foreground">Données réelles de votre parc matériel.</p>
      </div>

      <PerformanceDashboard />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <Card 
            key={index} 
            className={cn(
              "shadow-lg border-l-4 cursor-pointer transition-all hover:scale-[1.03] hover:shadow-xl active:scale-95", 
              kpi.color
            )}
            onClick={() => navigate(kpi.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium uppercase text-muted-foreground">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <div className={cn("text-3xl font-bold", kpi.textColor)}>{kpi.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;