"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  Plus,
  Search,
  AlertTriangle,
  Loader2,
  Calendar,
  Hash,
  History,
  Printer,
  TrendingUp,
  Database,
  Share2,
  Activity
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

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
  packaging: string | null;
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

  const [historyReagent, setHistoryReagent] = useState<{
    id: string;
    name: string;
  } | null>(null);
// MODIFIE CETTE PARTIE DANS ReagentsPage.tsx
const fetchReagentsAndAudit = useCallback(async () => {
  try {
    setIsLoading(true);

    // SUPPRIME OU COMMENTE CES LIGNES DE FILTRE DE DATE
    // const thirtyDaysAgo = new Date();
    // thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    const [reagentsRes, movementsRes, profilesRes] = await Promise.all([
      supabase.from("lab_reagents").select("*").order("name"),
      supabase.from("reagent_stock_movements")
              .select("*, lab_reagents(name)")
              // .gte("created_at", thirtyDaysAgoStr) // SUPPRIME CETTE LIGNE
              .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, first_name, last_name")
    ]);
    
    // ... reste du code

      if (reagentsRes.error) throw reagentsRes.error;

      setReagents((reagentsRes.data as Reagent[]) ?? []);

      const techMap = new Map((profilesRes.data || []).map(p => [p.id, `${p.first_name} ${p.last_name}`]));
      
      // Adaptation du mapping selon les colonnes de reagent_stock_movements
      const formattedLogs: AuditLog[] = (movementsRes.data || []).map((m: any) => ({
        id: m.id,
        reagent_id: m.reagent_id,
        reagent_name: m.lab_reagents?.name || "Réactif Supprimé",
        type: m.movement_type, // Correspond à la colonne de ta table
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
      name: name.substring(0, 15) + "...",
      valeur: value
    })).sort((a, b) => b.valeur - a.valeur).slice(0, 5);

    return { totalValuation, totalCritical, chartData };
  }, [reagents, auditLogs, calculateStockStatus]);

  // Reste du composant...
  // (Le reste du JSX reste identique, l'affichage sera alimenté par le fetch corrigé)

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ... ton code existant ... */}
      {/* Assure-toi que les appels à fetchReagentsAndAudit sont présents partout */}
    </div>
  );
};

export default ReagentsPage;