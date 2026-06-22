"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlaskConical, Plus, Search, AlertTriangle, Loader2, Calendar, Hash, History, Printer, TrendingUp, Database, Share2, Activity } from "lucide-react";
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

// ... (Interfaces Reagent et AuditLog restent identiques)

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
        reagent_name: m.lab_reagents?.name || "Réactif",
        type: m.movement_type,
        quantity: m.quantity,
        reason: m.reason || "Non renseigné",
        created_at: m.created_at,
        tech_name: m.technician_id ? techMap.get(m.technician_id) || "Technicien" : "Système"
      }));

      setAuditLogs(formattedLogs);
    } catch (err: any) {
      showError("Erreur d'audit ISO.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchReagentsAndAudit(); }, [fetchReagentsAndAudit]);

  // Réintègre ici tes fonctions : calculateStockStatus, stats, getExpiryStatus, sendWhatsAppAlert, handlePrintAudit...
  // Réintègre tout ton JSX original (Header, Stats, Graphiques, Tableau complet, Modal)

  return (
     <div className="space-y-8 animate-in fade-in duration-300">
        {/* Ton header complet, tes KPIs, ton graphique, ton registre restauré, et ton tableau */}
     </div>
  );
};