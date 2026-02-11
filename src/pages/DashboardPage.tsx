import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, Factory, Clock, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import PerformanceDashboard from "@/components/PerformanceDashboard";
import { supabase } from "@/integrations/supabase/client";

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    openOrders: 0,
    brokenAssets: 0,
    totalAssets: 0,
    availability: 100
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      
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
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-primary tracking-tight">Tableau de Bord</h1>
        <p className="text-lg text-muted-foreground">Données réelles de votre parc matériel.</p>
      </div>

      <PerformanceDashboard />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg border-l-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">OT Ouverts</CardTitle>
            <Wrench className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="animate-spin" /> : <div className="text-3xl font-bold">{stats.openOrders}</div>}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-l-4 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">En Panne</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="animate-spin" /> : <div className="text-3xl font-bold text-red-600">{stats.brokenAssets}</div>}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Total Actifs</CardTitle>
            <Factory className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="animate-spin" /> : <div className="text-3xl font-bold">{stats.totalAssets}</div>}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Disponibilité</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="animate-spin" /> : <div className="text-3xl font-bold">{stats.availability.toFixed(1)}%</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;