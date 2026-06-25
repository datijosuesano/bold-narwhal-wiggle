"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useReactToPrint } from "react-to-print";
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
  Loader2,
  History,
  Printer,
  TrendingUp,
  Database,
  Share2,
  Activity,
  Eye,
  FileCheck2
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
  DialogFooter,
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [historyReagent, setHistoryReagent] = useState<{ id: string; name: string } | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchReagentsAndAudit = useCallback(async () => {
    try {
      setIsLoading(true);

      const [reagentsRes, movementsRes, profilesRes] = await Promise.all([
        supabase.from("lab_reagents").select("*").order("name"),
        supabase.from("reagent_stock_movements")
                .select("*, lab_reagents(name)")
                .order("created_at", { ascending: false })
                .limit(100),
        supabase.from("profiles").select("id, first_name, last_name")
      ]);

      if (reagentsRes.error) throw reagentsRes.error;
      setReagents((reagentsRes.data as Reagent[]) ?? []);

      const textMap = new Map((profilesRes.data || []).map(p => [p.id, `${p.first_name} ${p.last_name}`]));
      
      const formattedLogs: AuditLog[] = (movementsRes.data || []).map((m: any) => ({
        id: m.id,
        reagent_id: m.reagent_id,
        reagent_name: m.lab_reagents?.name || "Réactif",
        type: m.movement_type, 
        quantity: m.quantity,
        reason: m.reason || "Non renseigné",
        created_at: m.created_at,
        tech_name: m.technician_id ? textMap.get(m.technician_id) || "Technicien" : "Système"
      }));

      setAuditLogs(formattedLogs);
    } catch (err: any) {
      showError("Erreur lors du chargement des données.");
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
    const deliveryDelay = 7;
    const reorderPoint = Math.ceil(reagent.min_stock + (dailyConsumption * deliveryDelay));
    const isCritical = reagent.current_stock <= reorderPoint;

    return { isCritical, dailyConsumption, reorderPoint, consumption30d };
  }, [auditLogs]);

  // MODULE DE CALCUL PROGRESSIF DE LA PÉREMPTION
  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const date = new Date(expiryDate);
    const today = new Date();
    const daysLeft = differenceInDays(date, today);

    if (isBefore(date, today)) {
      return { label: "PÉRIMÉ (REBUT)", class: "bg-red-600 text-white animate-pulse", level: "expired", critical: true };
    }
    if (daysLeft <= 30) {
      return { label: `Critique : ${daysLeft} j`, class: "bg-red-50 text-white font-black", level: "critical", critical: true };
    }
    if (daysLeft <= 90) {
      return { label: `Urgence : ${Math.ceil(daysLeft / 30)} mois`, class: "bg-orange-500 text-white font-bold", level: "warning", critical: true };
    }
    if (daysLeft <= 180) {
      return { label: `Échéance : ${Math.ceil(daysLeft / 30)} mois`, class: "bg-amber-500 text-white font-medium", level: "info", critical: true };
    }
    return null;
  };

  const stats = useMemo(() => {
    const totalValuation = reagents.reduce((sum, r) => sum + (r.current_stock * (r.purchase_cost || 0)), 0);
    let totalCritical = 0;
    
    // Initialisation des compteurs dynamiques
    let expiredCount = 0;
    let criticalCount = 0; 
    let warningCount = 0;  
    let infoCount = 0;     

    reagents.forEach(r => {
      if (calculateStockStatus(r).isCritical) totalCritical++;
      
      const expiry = getExpiryStatus(r.expiry_date);
      if (expiry) {
        if (expiry.level === "expired") expiredCount++;
        if (expiry.level === "critical") criticalCount++;
        if (expiry.level === "warning") warningCount++;
        if (expiry.level === "info") infoCount++;
      }
    });

    const totalExpiredOrExpiring = expiredCount + criticalCount + warningCount + infoCount;

    const consumptionMap: Record<string, number> = {};
    auditLogs.filter(l => l.type === 'OUT').forEach(log => {
      consumptionMap[log.reagent_name] = (consumptionMap[log.reagent_name] || 0) + Math.abs(log.quantity);
    });

    const chartData = Object.entries(consumptionMap).map(([name, value]) => ({
      name: name.substring(0, 15) + "...",
      valeur: value
    })).sort((a, b) => b.valeur - a.valeur).slice(0, 5);

    return { 
      totalValuation, 
      totalCritical, 
      totalExpiredOrExpiring, 
      expiredCount, 
      criticalCount, 
      warningCount, 
      infoCount,
      chartData 
    };
  }, [reagents, auditLogs, calculateStockStatus]);

  const sendWhatsAppAlert = (reagent: Reagent) => {
    const { dailyConsumption, reorderPoint } = calculateStockStatus(reagent);
    const text = `⚠️ *ALERTE BIO-PULSE GMAO*\n\nLe réactif *${reagent.name}* (Ref: ${reagent.reference}) nécessite un réapprovisionnement.\n\n*Stock actuel :* ${reagent.current_stock} ${reagent.unit}\n*Point de commande :* ${reorderPoint} ${reagent.unit}\n*Consommation moyenne :* ${dailyConsumption.toFixed(2)} / jour\n\nMerci de déclencher une commande d'urgence.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredReagents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return reagents;
    return reagents.filter(r => r.name.toLowerCase().includes(term) || r.reference.toLowerCase().includes(term));
  }, [reagents, searchTerm]);

  const handleConfirmPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Inventaire_Reactifs_${format(new Date(), "yyyy-MM-dd")}`,
    onAfterPrint: () => setIsPreviewOpen(false), 
    pageStyle: `
      @page {
        size: landscape;
        margin: 15mm;
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    `,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER ECRAN */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <FlaskConical className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Traçabilité & Réactifs</h1>
            <p className="text-lg text-muted-foreground">Gestion intelligente des approvisionnements</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsPreviewOpen(true)} variant="outline" className="rounded-xl border-slate-200 font-bold h-11 hover:bg-slate-50">
            <FileCheck2 size={16} className="mr-1.5 text-blue-600" /> Aperçu & Exporter
          </Button>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 rounded-xl shadow-md font-bold h-11 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" /> Enregistrer Réactif
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-xl">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau réactif</DialogTitle>
                <DialogDescription>Ajoutez un produit à l’inventaire.</DialogDescription>
              </DialogHeader>
              <CreateReagentForm onSuccess={() => { setIsCreateOpen(false); fetchReagentsAndAudit(); }} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIS ECRAN */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="shadow-sm border-l-4 border-l-amber-500 bg-white">
          <CardHeader className="pb-1"><CardDescription className="text-[10px] font-black uppercase text-slate-400">À Commander</CardDescription></CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{stats.totalCritical}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Produits sous le point de commande</p>
          </CardContent>
        </Card>

        {/* CARTE DE SUIVI PROGRESSIF DES PÉREMPTIONS */}
        <Card className="shadow-sm border-