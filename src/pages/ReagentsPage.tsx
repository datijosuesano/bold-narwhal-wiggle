"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Plus, Search, AlertTriangle, Loader2, Calendar, Hash, History, Printer, TrendingUp, Database, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

import CreateReagentForm from "@/components/CreateReagentForm";
import ReagentStockAdjustment from "@/components/ReagentStockAdjustment";
import ReagentHistoryDialog from "@/components/ReagentHistoryDialog";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { format, differenceInDays, isBefore } from "date-fns";

interface Reagent {
  id: string;
  name: string;
  reference: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  lot_number: string | null;
  expiry_date: string | null;
  purchase_cost?: number;
}

interface AuditLog {
  id: string;
  reagent_id: string;
  reagent_name: string;
  type: string;
  quantity: number;
  reason: string;
  created_at: string;
  tech_name?: string;
}

const ReagentsPage: React.FC = () => {
  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [historyReagent, setHistoryReagent] = useState<{ id: string; name: string } | null>(null);

  const fetchReagentsAndAudit = useCallback(async () => {
    try {
      setIsLoading(true);

      const [reagentsRes, movementsRes, profilesRes] = await Promise.all([
        supabase.from("lab_reagents").select("*").order("name"),
        supabase.from("reagent_stock_movements")
                .select("*, lab_reagents(name)")
                .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, first_name, last_name")
      ]);

      if (reagentsRes.error) throw reagentsRes.error;
      setReagents((reagentsRes.data as Reagent[]) ?? []);

      const techMap = new Map((profilesRes.data || []).map(p => [p.id, `${p.first_name} ${p.last_name}`]));
      
      const formattedLogs: AuditLog[] = (movementsRes.data || []).map((m: any) => ({
        id: m.id,
        reagent_id: m.reagent_id,
        reagent_name: m.lab_reagents?.name || "Inconnu",
        type: m.movement_type, 
        quantity: m.quantity,
        reason: m.reason || "Non renseigné",
        created_at: m.created_at,
        tech_name: m.technician_id ? techMap.get(m.technician_id) || "Technicien" : "Automatique"
      }));

      setAuditLogs(formattedLogs);
    } catch (err: any) {
      showError("Erreur d'audit ISO : Impossible de charger les données.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReagentsAndAudit();
  }, [fetchReagentsAndAudit]);

  const calculateStockStatus = useCallback((reagent: Reagent) => {
    const reagentMovements = auditLogs.filter(m => m.reagent_id === reagent.id && m.type === 'OUT');
    const consumption30d = reagentMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    const dailyConsumption = consumption30d / 30;
    const reorderPoint = Math.ceil(reagent.min_stock + (dailyConsumption * 7));
    const isCritical = reagent.current_stock <= reorderPoint;
    return { isCritical, dailyConsumption, reorderPoint };
  }, [auditLogs]);

  const stats = useMemo(() => {
    const totalValuation = reagents.reduce((sum, r) => sum + (r.current_stock * (r.purchase_cost || 0)), 0);
    let totalCritical = 0;
    reagents.forEach(r => { if (calculateStockStatus(r).isCritical) totalCritical++; });
    
    const consumptionMap: Record<string, number> = {};
    auditLogs.filter(l => l.type === 'OUT').forEach(log => {
      consumptionMap[log.reagent_name] = (consumptionMap[log.reagent_name] || 0) + Math.abs(log.quantity);
    });

    const chartData = Object.entries(consumptionMap).map(([name, value]) => ({
      name: name.substring(0, 10),
      valeur: value
    })).sort((a, b) => b.valeur - a.valeur).slice(0, 5);

    return { totalValuation, totalCritical, chartData };
  }, [reagents, auditLogs, calculateStockStatus]);

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black">Traçabilité Réactifs</h1>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> Enregistrer Réactif
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Ton contenu de Dashboard existant... */}
      </div>

      {/* Registre d'audit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Database size={18} className="mr-2 text-emerald-600" /> Registre d'Audit</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[300px] overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 border-b flex justify-between items-center text-xs">
              <div>
                <span className={cn("font-bold", log.type === 'IN' ? "text-green-600" : "text-red-600")}>
                  {log.type === 'IN' ? '+' : '-'}{Math.abs(log.quantity)}
                </span>
                <span className="ml-2 font-semibold">{log.reagent_name}</span>
              </div>
              <div className="text-slate-400">{format(new Date(log.created_at), 'dd/MM HH:mm')}</div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* ... Suite de ton tableau des réactifs ... */}
    </div>
  );
};

export default ReagentsPage;