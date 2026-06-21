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

  // ===== CHARGEMENT DES REACTIFS ET DES AUDITS (ISO 9001) =====
  const fetchReagentsAndAudit = useCallback(async () => {
    try {
      setIsLoading(true);

      // On récupère les mouvements des 30 derniers jours pour le calcul de gestion des stocks
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

      const [reagentsRes, movementsRes, profilesRes] = await Promise.all([
        supabase.from("lab_reagents").select("*").order("name"),
        supabase.from("lab_reagent_movements")
                .select("*, lab_reagents(name)")
                .gte("created_at", thirtyDaysAgoStr)
                .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, first_name, last_name")
      ]);

      if (reagentsRes.error) throw reagentsRes.error;

      setReagents((reagentsRes.data as Reagent[]) ?? []);

      // Formater l'audit log
      const techMap = new Map((profilesRes.data || []).map(p => [p.id, `${p.first_name} ${p.last_name}`]));
      const formattedLogs: AuditLog[] = (movementsRes.data || []).map((m: any) => ({
        id: m.id,
        reagent_id: m.reagent_id,
        reagent_name: m.lab_reagents?.name || "Réactif Supprimé",
        type: m.type,
        quantity: m.quantity,
        reason: m.reason || "Non renseigné",
        created_at: m.created_at,
        tech_name: m.user_id ? techMap.get(m.user_id) || "Technicien" : "Automatique / Système"
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

  // ===== LOGIQUE DE GESTION DES STOCKS (COURS GLT) =====
  const calculateStockStatus = useCallback((reagent: Reagent) => {
    // 1. Filtrer les mouvements des 30 derniers jours pour CE réactif
    const reagentMovements = auditLogs.filter(m => m.reagent_id === reagent.id && m.type === 'OUT');
    
    // 2. Consommation totale sur 30 jours
    const consumption30d = reagentMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    
    // 3. Consommation journalière
    const dailyConsumption = consumption30d / 30;
    
    // 4. Point de commande (Stock sécu + Consommation pendant le délai de livraison de 7 jours)
    const deliveryDelay = 7;
    const reorderPoint = Math.ceil(reagent.min_stock + (dailyConsumption * deliveryDelay));
    
    // 5. Alerte si le stock actuel franchit le point de commande
    const isCritical = reagent.current_stock <= reorderPoint;

    return { isCritical, dailyConsumption, reorderPoint, consumption30d };
  }, [auditLogs]);


  // ===== FILTRAGE REACTIFS =====
  const filteredReagents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return reagents;

    return reagents.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.reference.toLowerCase().includes(term)
    );
  }, [reagents, searchTerm]);

  // ===== EXPIRY LOGIC =====
  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;

    const date = new Date(expiryDate);
    const today = new Date();
    const daysLeft = differenceInDays(date, today);

    if (isBefore(date, today)) {
      return {
        label: "PÉRIMÉ (ISO REBUT)",
        class: "bg-red-600 text-white animate-pulse",
        icon: <AlertTriangle size={10} />,
        critical: true
      };
    }

    if (daysLeft <= 45) {
      return {
        label: `Alerte Expiration : ${daysLeft} jours`,
        class: "bg-amber-500 text-white font-bold",
        icon: <Calendar size={10} />,
        critical: true
      };
    }

    return null;
  };

  // ===== STATISTIQUES & ANALYSE DE CONSOMMATION =====
  const stats = useMemo(() => {
    const totalValuation = reagents.reduce((sum, r) => sum + (r.current_stock * (r.purchase_cost || 0)), 0);
    
    // On compte les alertes intelligentes (basées sur le point de commande calculé)
    let totalCritical = 0;
    reagents.forEach(r => {
      if (calculateStockStatus(r).isCritical) totalCritical++;
    });
    
    // Compter les expirations critiques
    let totalExpiredOrExpiring = 0;
    reagents.forEach(r => {
      const status = getExpiryStatus(r.expiry_date);
      if (status?.critical) {
        totalExpiredOrExpiring++;
      }
    });

    // Données consommation mensuelle (Recharts)
    const consumptionMap: Record<string, number> = {};
    auditLogs.filter(l => l.type === 'OUT').forEach(log => {
      consumptionMap[log.reagent_name] = (consumptionMap[log.reagent_name] || 0) + Math.abs(log.quantity);
    });

    const chartData = Object.entries(consumptionMap).map(([name, value]) => ({
      name: name.substring(0, 15) + "...",
      valeur: value
    })).sort((a, b) => b.valeur - a.valeur).slice(0, 5); // Top 5 des plus consommés

    return {
      totalValuation,
      totalCritical,
      totalExpiredOrExpiring,
      chartData
    };
  }, [reagents, auditLogs, calculateStockStatus]);

  // ===== NOTIFICATION WHATSAPP DIRECTE (ALERTES INTELLIGENTES) =====
  const sendWhatsAppAlert = (reagent: Reagent) => {
    const { dailyConsumption, reorderPoint } = calculateStockStatus(reagent);
    const text = `⚠️ *ALERTE BIO-PULSE GMAO*\n\nLe réactif *${reagent.name}* (Ref: ${reagent.reference}) nécessite un réapprovisionnement.\n\n*Stock actuel :* ${reagent.current_stock} ${reagent.unit}\n*Point de commande :* ${reorderPoint} ${reagent.unit}\n*Consommation moyenne :* ${dailyConsumption.toFixed(2)} / jour\n\nMerci de déclencher une commande d'urgence auprès du fournisseur.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // ===== EXPORT PDF DE L'INVENTAIRE (ISO AUDIT) =====
  const handlePrintAudit = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center print:hidden">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <FlaskConical className="h-8 w-8 text-blue-600" />
          </div>

          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">
              Traçabilité & Réactifs
            </h1>
            <p className="text-lg text-muted-foreground">
              Gestion intelligente des approvisionnements (Méthode du Point de Commande)
            </p>
          </div>
        </div>

        {/* ===== ACTIONS ===== */}
        <div className="flex gap-2">
          <Button onClick={handlePrintAudit} variant="outline" className="rounded-xl border-slate-200 font-bold h-11">
            <Printer size={16} className="mr-1.5" /> Exporter PDF Inventaire
          </Button>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 rounded-xl shadow-md font-bold h-11">
                <Plus className="mr-2 h-4 w-4" />
                Enregistrer Réactif
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px] rounded-xl">
              <DialogHeader>
                <DialogTitle>Ajouter un nouveau réactif</DialogTitle>
                <DialogDescription>
                  Ajoutez un produit à l’inventaire de laboratoire de l'établissement partenaire.
                </DialogDescription>
              </DialogHeader>

              <CreateReagentForm
                onSuccess={() => {
                  setIsCreateOpen(false);
                  fetchReagentsAndAudit();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ===== KPIS & ANALYSES PRÉVISIONNELLES (ISO) ===== */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 print:hidden">
        <Card className="shadow-sm border-l-4 border-l-amber-500 bg-white">
          <CardHeader className="pb-1">
            <CardDescription className="text-[10px] font-black uppercase text-slate-400">À Commander (Point de Cde)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{stats.totalCritical}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Produits ayant franchi leur point de commande dynamique</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-red-600 bg-white">
          <CardHeader className="pb-1">
            <CardDescription className="text-[10px] font-black uppercase text-slate-400">Péremptions critiques</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">{stats.totalExpiredOrExpiring}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Réactifs arrivant à échéance sous 45 jours</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-indigo-600 bg-white">
          <CardHeader className="pb-1">
            <CardDescription className="text-[10px] font-black uppercase text-slate-400">Valorisation du Stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-indigo-700">
              {stats.totalValuation.toLocaleString()} <span className="text-sm font-normal">FCFA</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Valeur financière totale des réactifs stockés</p>
          </CardContent>
        </Card>
      </div>

      {/* ===== GRILLE : GRAPHIQUE CONSOMMATION & LOGS D'AUDIT COMPLETS ===== */}
      <div className="grid gap-8 lg:grid-cols-12 print:hidden">
        {/* Graphique de consommation mensuelle (5/12) */}
        <Card className="shadow-xl border-none bg-white rounded-2xl lg:col-span-5 flex flex-col justify-between">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-black flex items-center text-slate-900 uppercase tracking-tight">
              <TrendingUp size={18} className="mr-2 text-blue-600" /> Top Consommation (30 Jours)
            </CardTitle>
            <CardDescription className="text-xs">
              Mouvements de sortie de stock les plus élevés ce mois-ci.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 h-[250px] flex items-center justify-center">
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" style={{ fontSize: '10px' }} />
                  <YAxis style={{ fontSize: '10px' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="valeur" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30}>
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#2563eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 italic">Aucune sortie de réactifs enregistrée.</p>
            )}
          </CardContent>
        </Card>

        {/* Audit Log ISO 9001 (7/12) - Affichage limité aux 20 derniers pour l'interface */}
        <Card className="shadow-xl border-none bg-white rounded-2xl lg:col-span-7 flex flex-col justify-between">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-black flex items-center text-slate-900 uppercase tracking-tight">
              <Database size={18} className="mr-2 text-emerald-600" /> Registre d'Audit des Mouvements
            </CardTitle>
            <CardDescription className="text-xs">
              Traçabilité des derniers ajustements (Entrées/Sorties).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 max-h-[250px] overflow-y-auto custom-scrollbar">
            {auditLogs.length > 0 ? (
              <div className="divide-y text-xs">
                {auditLogs.slice(0, 30).map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-1.5 rounded-lg text-white font-bold min-w-[36px] text-center",
                        log.type === 'IN' ? "bg-green-600" : "bg-red-500"
                      )}>
                        {log.type === 'IN' ? '+' : '-'}{Math.abs(log.quantity)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{log.reagent_name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">{log.reason}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black text-blue-600">{log.tech_name}</p>
                      <p className="text-[9px] text-slate-400">{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-8 text-center text-slate-400 italic text-xs">Aucun mouvement à auditer.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== RECHERCHE & TABLE DE STOCK ===== */}
      <Card className="shadow-lg overflow-hidden border-none bg-white rounded-2xl print:shadow-none print:border-none">
        <CardHeader className="border-b bg-slate-50/50 print:bg-transparent">
          <div className="flex justify-between items-center print:hidden">
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <FlaskConical size={16} className="text-blue-600" /> Inventaire & Pilotage des Stocks
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par nom ou référence..."
                className="pl-10 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="hidden print:block">
            <h1 className="text-center font-black text-2xl uppercase border-b-4 border-black pb-3">RAPPORT D'INVENTAIRE ET D'AUDIT DES STOCKS DE RÉACTIFS BIOLOGIQUES</h1>
            <p className="text-right text-xs mt-2 font-mono">Date d'édition : {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground border-b print:bg-slate-200">
                <tr>
                  <th className="px-6 py-4">Nom du Produit / Lot</th>
                  <th className="px-6 py-4">Péremption</th>
                  <th className="px-6 py-4">Niveau de Stock</th>
                  <th className="px-6 py-4 print:hidden">Ajustement</th>
                  <th className="px-6 py-4 text-right print:hidden">Audit / Action</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">
                      <Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600" />
                    </td>
                  </tr>
                ) : filteredReagents.length > 0 ? (
                  filteredReagents.map((reagent) => {
                    const expiry = getExpiryStatus(reagent.expiry_date);
                    // Utilisation de notre nouvelle logique pour l'affichage
                    const { isCritical, dailyConsumption, reorderPoint } = calculateStockStatus(reagent);

                    return (
                      <tr
                        key={reagent.id}
                        className={cn(
                          "hover:bg-accent/50 transition-colors",
                          isCritical && "bg-amber-50/20"
                        )}
                      >
                        {/* PRODUIT */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {reagent.name}
                          </div>

                          <div className="flex gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="text-[9px] font-mono flex items-center bg-white shadow-sm"
                            >
                              <Hash size={8} className="mr-1" />
                              LOT: {reagent.lot_number || "SANS LOT"}
                            </Badge>

                            <Badge
                              variant="outline"
                              className="text-[9px] bg-white shadow-sm"
                            >
                              REF: {reagent.reference}
                            </Badge>
                          </div>
                        </td>

                        {/* EXPIRATION */}
                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold">
                            {reagent.expiry_date
                              ? format(
                                  new Date(reagent.expiry_date),
                                  "dd/MM/yyyy"
                                )
                              : "---"}
                          </div>

                          {expiry && (
                            <Badge
                              className={cn(
                                "mt-1 rounded-full text-[9px] font-bold text-white",
                                expiry.class
                              )}
                            >
                              {expiry.label}
                            </Badge>
                          )}
                        </td>

                        {/* STOCK & ANALYSE DE CONSOMMATION */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span
                              className={cn(
                                "text-lg font-black mr-2",
                                isCritical ? "text-red-600" : "text-blue-600"
                              )}
                            >
                              {reagent.current_stock}
                            </span>
                            <span className="text-xs text-muted-foreground uppercase font-bold">
                              {reagent.unit}
                            </span>
                          </div>
                          {/* Indicateurs de gestion des stocks */}
                          <div className="mt-1 flex flex-col gap-0.5">
                            <div className="text-[10px] text-slate-500 flex items-center">
                              <Activity size={10} className="mr-1 text-slate-400"/> Conso moyenne: {dailyConsumption.toFixed(1)}/jour
                            </div>
                            {isCritical ? (
                              <div className="text-[10px] text-red-600 font-bold">
                                ⚠️ Point de cde ({reorderPoint}) franchi !
                              </div>
                            ) : (
                              <div className="text-[10px] text-emerald-600 font-medium">
                                Point de cde: {reorderPoint} {reagent.unit}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* MOUVEMENT */}
                        <td className="px-6 py-4 print:hidden">
                          <ReagentStockAdjustment
                            reagentId={reagent.id}
                            currentStock={reagent.current_stock}
                            reagentName={reagent.name}
                            onSuccess={fetchReagentsAndAudit}
                          />
                        </td>

                        {/* ACTIONS & SMART ALERT (WHATSAPP) */}
                        <td className="px-6 py-4 text-right print:hidden">
                          <div className="flex justify-end gap-1.5">
                            {isCritical && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl text-amber-600 hover:bg-amber-50"
                                onClick={() => sendWhatsAppAlert(reagent)}
                                title="Envoyer une alerte WhatsApp d'urgence au fournisseur"
                              >
                                <Share2 size={16} />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-xl text-blue-600 hover:bg-blue-50"
                              onClick={() =>
                                setHistoryReagent({
                                  id: reagent.id,
                                  name: reagent.name,
                                })
                              }
                            >
                              <History size={18} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-muted-foreground italic">
                      Aucun réactif biologique en stock.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ===== HISTORY MODAL ===== */}
      <ReagentHistoryDialog
        reagentId={historyReagent?.id || null}
        reagentName={historyReagent?.name || null}
        isOpen={!!historyReagent}
        onClose={() => setHistoryReagent(null)}
      />

      {/* STYLES D'IMPRESSION COMPATIBLES AVEC L'AUDIT DE STOCKS DIRECTS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden, button, header, nav, aside, footer {
            display: none !important;
          }
          .bg-white.rounded-2xl {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .bg-white.rounded-2xl * {
            visibility: visible;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 10px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReagentsPage;