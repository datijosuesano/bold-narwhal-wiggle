import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { startOfMonth } from "date-fns";
import NotificationBell from "@/components/NotificationBell";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import {
  Factory,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign
} from "lucide-react";

const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole(["admin"]);

  const [stats, setStats] = useState({
    totalAssets: 0,
    brokenAssets: 0,
    operationalAssets: 0,
    interventionsMonth: 0,
    avgRepairTime: 4.2,
    totalCosts: 0,
    topTech: "---",
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const startMonth = startOfMonth(new Date()).toISOString();

      // =========================
      // 1. ASSETS (statut équipement)
      // =========================
      const { data: assets } = await supabase
        .from("assets")
        .select("status");

      const totalAssets = assets?.length || 0;
      const brokenAssets =
        assets?.filter((a) => a.status !== "Opérationnel").length || 0;

      // =========================
      // 2. INTERVENTIONS DU MOIS (SERVER FILTER)
      // =========================
      const { data: interventions } = await supabase
        .from("interventions")
        .select("total_cost, intervention_date, technician_id")
        .gte("intervention_date", startMonth);

      const interventionsMonth = interventions?.length || 0;

      const totalCosts =
        interventions?.reduce(
          (sum, i) => sum + (Number(i.total_cost) || 0),
          0
        ) || 0;

      // =========================
      // 3. TOP TECHNICIEN (CORRIGÉ)
      // =========================
      const { data: techData } = await supabase
        .from("interventions")
        .select("technician_id, profiles(first_name, last_name)");

      let topTech = "---";

      if (techData && techData.length > 0) {
        const countByTech: Record<string, number> = {};

        techData.forEach((t) => {
          if (!t.technician_id) return;
          countByTech[t.technician_id] =
            (countByTech[t.technician_id] || 0) + 1;
        });

        const bestTechId = Object.entries(countByTech).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0];

        const bestTech = techData.find(
          (t) => t.technician_id === bestTechId
        );

        if (bestTech?.profiles) {
          topTech = `${bestTech.profiles.first_name} ${bestTech.profiles.last_name}`;
        }
      }

      // =========================
      // 4. PANNES SIGNALÉES
      // =========================
      const { count: reportedBreakdowns } = await supabase
        .from("work_orders")
        .select("*", { count: "exact", head: true })
        .not("reporter_name", "is", null)
        .eq("status", "Ouvert");

      // =========================
      // SET STATE
      // =========================
      setStats({
        totalAssets,
        brokenAssets,
        operationalAssets: totalAssets - brokenAssets,
        interventionsMonth,
        avgRepairTime: 4.2, // placeholder (à calculer plus tard)
        totalCosts,
        topTech,
      });

    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const kpis = [
    {
      title: "Parc Total",
      value: stats.totalAssets,
      icon: <Factory className="text-blue-600" />
    },
    {
      title: "En Panne",
      value: stats.brokenAssets,
      icon: <AlertTriangle className="text-red-600" />
    },
    {
      title: "Opérationnels",
      value: stats.operationalAssets,
      icon: <CheckCircle2 className="text-green-600" />
    },
    ...(isAdmin
      ? [
          {
            title: "Coûts Mois",
            value: `${stats.totalCosts.toLocaleString()} F`,
            icon: <DollarSign className="text-amber-600" />
          }
        ]
      : [])
  ];

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-primary uppercase">
            BIOPULSE
          </h1>
          <p className="text-muted-foreground">
            Performance du service technique
          </p>
        </div>
        <NotificationBell />
      </div>

      {/* KPI */}
      <div className={cn(
        "grid gap-6 md:grid-cols-2",
        isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"
      )}>
        {kpis.map((kpi, i) => (
          <Card key={i} className="shadow-lg hover:scale-[1.02] transition">
            <CardHeader className="flex justify-between items-center pb-2">
              <CardTitle className="text-xs uppercase text-muted-foreground">
                {kpi.title}
              </CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CHART */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={18} /> Activité mensuelle
          </CardTitle>
        </CardHeader>

        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: "Jan", val: 12 },
                { name: "Fév", val: 18 },
                { name: "Mois", val: stats.interventionsMonth }
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="val" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* SIDE STATS */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* TOP TECH */}
        {isAdmin && (
          <Card className="bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-blue-400">
                Top technicien
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{stats.topTech}</p>
            </CardContent>
          </Card>
        )}

        {/* MTTR */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">
              Temps de réparation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-blue-600">
              {stats.avgRepairTime} j
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
};

export default DashboardPage;