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

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const date = new Date(expiryDate);
    const today = new Date();
    const daysLeft = differenceInDays(date, today);

    if (isBefore(date, today)) {
      return { label: "PÉRIMÉ", class: "bg-red-600 text-white animate-pulse", critical: true };
    }
    if (daysLeft <= 45) {
      return { label: `Alerte Expiration : ${daysLeft} jours`, class: "bg-amber-500 text-white font-bold", critical: true };
    }
    return null;
  };

  const stats = useMemo(() => {
    const totalValuation = reagents.reduce((sum, r) => sum + (r.current_stock * (r.purchase_cost || 0)), 0);
    let totalCritical = 0;
    let totalExpiredOrExpiring = 0;

    reagents.forEach(r => {
      if (calculateStockStatus(r).isCritical) totalCritical++;
      if (getExpiryStatus(r.expiry_date)?.critical) totalExpiredOrExpiring++;
    });

    const consumptionMap: Record<string, number> = {};
    auditLogs.filter(l => l.type === 'OUT').forEach(log => {
      consumptionMap[log.reagent_name] = (consumptionMap[log.reagent_name] || 0) + Math.abs(log.quantity);
    });

    const chartData = Object.entries(consumptionMap).map(([name, value]) => ({
      name: name.substring(0, 15) + "...",
      valeur: value
    })).sort((a, b) => b.valeur - a.valeur).slice(0, 5);

    return { totalValuation, totalCritical, totalExpiredOrExpiring, chartData };
  }, [reagents, auditLogs, calculateStockStatus]);

  const sendWhatsAppAlert = (reagent: Reagent) => {
    const { dailyConsumption, reorderPoint } = calculateStockStatus(reagent);
    const text = `⚠️ *ALERTE BIO-PULSE GMAO*\n\nLe réactif *${reagent.name}* (Ref: ${reagent.reference}) nécessite un réapprovisionnement.\n\n*Stock actuel :* ${reagent.current_stock} ${reagent.unit}\n*Point de commande :* ${reorderPoint} ${reagent.unit}\n*Consommation moyenne :* ${dailyConsumption.toFixed(2)} / jour\n\nMerci de déclencher une commande d'urgence.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Déclenchement de l'impression native
  const handlePrintAudit = () => {
    window.print();
  };

  const filteredReagents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return reagents;
    return reagents.filter(r => r.name.toLowerCase().includes(term) || r.reference.toLowerCase().includes(term));
  }, [reagents, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 print-container">
      
      {/* ===== HEADER (Caché à l'impression) ===== */}
      <div className="flex justify-between items-center print:hidden">
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
          <Button onClick={handlePrintAudit} variant="outline" className="rounded-xl border-slate-200 font-bold h-11">
            <Printer size={16} className="mr-1.5" /> Exporter PDF Inventaire
          </Button>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 rounded-xl shadow-md font-bold h-11">
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

      {/* ===== KPIS (Cachés à l'impression) ===== */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 print:hidden">
        <Card className="shadow-sm border-l-4 border-l-amber-500 bg-white">
          <CardHeader className="pb-1"><CardDescription className="text-[10px] font-black uppercase text-slate-400">À Commander</CardDescription></CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{stats.totalCritical}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Produits sous le point de commande</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-red-600 bg-white">
          <CardHeader className="pb-1"><CardDescription className="text-[10px] font-black uppercase text-slate-400">Péremptions</CardDescription></CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">{stats.totalExpiredOrExpiring}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Arrivant à échéance sous 45 jours</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-indigo-600 bg-white">
          <CardHeader className="pb-1"><CardDescription className="text-[10px] font-black uppercase text-slate-400">Valorisation du Stock</CardDescription></CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-indigo-700">{stats.totalValuation.toLocaleString()} <span className="text-sm font-normal">FCFA</span></div>
            <p className="text-[10px] text-muted-foreground mt-1">Valeur financière totale des réactifs stockés</p>
          </CardContent>
        </Card>
      </div>

      {/* ===== GRAPHIQUE ET AUDIT (Cachés à l'impression) ===== */}
      <div className="grid gap-8 lg:grid-cols-12 print:hidden">
        <Card className="shadow-xl border-none bg-white rounded-2xl lg:col-span-5 flex flex-col justify-between">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-black flex items-center text-slate-900 uppercase tracking-tight">
              <TrendingUp size={18} className="mr-2 text-blue-600" /> Top Consommation
            </CardTitle>
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

        <Card className="shadow-xl border-none bg-white rounded-2xl lg:col-span-7 flex flex-col justify-between">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-black flex items-center text-slate-900 uppercase tracking-tight">
              <Database size={18} className="mr-2 text-emerald-600" /> Registre d'Audit des Mouvements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[250px] overflow-y-auto custom-scrollbar">
            {auditLogs.length > 0 ? (
              <div className="divide-y text-xs">
                {auditLogs.slice(0, 30).map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-1.5 rounded-lg text-white font-bold min-w-[36px] text-center", log.type === 'IN' ? "bg-green-600" : "bg-red-500")}>
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

      {/* ===== TABLE DE STOCK ===== */}
      <Card className="shadow-lg overflow-hidden border-none bg-white rounded-2xl print:shadow-none print:border-none print:m-0 print:p-0 print:w-full">
        <CardHeader className="border-b bg-slate-50/50 print:bg-transparent print:border-none print:p-0">
          
          {/* Version Écran */}
          <div className="flex justify-between items-center print:hidden">
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <FlaskConical size={16} className="text-blue-600" /> Inventaire & Pilotage des Stocks
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Rechercher par nom ou référence..." className="pl-10 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          {/* En-tête officiel visible uniquement à l'impression */}
          <div className="hidden print:block print:mb-6">
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
              <div>
                <h1 className="text-xl font-black uppercase text-black">Rapport d'Inventaire</h1>
                <p className="text-sm font-bold text-gray-700">Stocks de Réactifs Biologiques</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">BioPulse GMAO</p>
                <p className="text-xs font-mono mt-1">Édité le : {format(new Date(), 'dd/MM/yyyy à HH:mm')}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 print:p-0">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left print-table">
              <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground border-b print:bg-gray-100 print:text-black">
                <tr>
                  <th className="px-6 py-4 print:py-2 print:px-2 print:border">Nom du Produit / Lot</th>
                  <th className="px-6 py-4 print:py-2 print:px-2 print:border">Péremption</th>
                  <th className="px-6 py-4 print:py-2 print:px-2 print:border">Niveau de Stock</th>
                  <th className="px-6 py-4 print:hidden">Ajustement</th>
                  <th className="px-6 py-4 text-right print:hidden">Audit / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y print:divide-gray-300">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-10 print:hidden"><Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600" /></td></tr>
                ) : filteredReagents.length > 0 ? (
                  filteredReagents.map((reagent) => {
                    const expiry = getExpiryStatus(reagent.expiry_date);
                    const { isCritical, dailyConsumption, reorderPoint } = calculateStockStatus(reagent);

                    return (
                      <tr key={reagent.id} className={cn("hover:bg-accent/50 transition-colors", isCritical && "bg-amber-50/20 print:bg-gray-50")}>
                        <td className="px-6 py-4 print:py-2 print:px-2 print:border">
                          <div className="font-bold text-slate-900 text-sm print:text-black">{reagent.name}</div>
                          <div className="flex gap-2 mt-1 print:hidden">
                            <Badge variant="outline" className="text-[9px] font-mono flex items-center bg-white shadow-sm"><Hash size={8} className="mr-1" />LOT: {reagent.lot_number || "SANS LOT"}</Badge>
                            <Badge variant="outline" className="text-[9px] bg-white shadow-sm">REF: {reagent.reference}</Badge>
                          </div>
                          <div className="hidden print:block text-xs mt-1 text-gray-600">
                            Ref: {reagent.reference} | Lot: {reagent.lot_number || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 print:py-2 print:px-2 print:border">
                          <div className="text-xs font-semibold print:text-black">{reagent.expiry_date ? format(new Date(reagent.expiry_date), "dd/MM/yyyy") : "---"}</div>
                          <div className="print:hidden">
                            {expiry && <Badge className={cn("mt-1 rounded-full text-[9px] font-bold text-white", expiry.class)}>{expiry.label}</Badge>}
                          </div>
                          {expiry?.critical && <div className="hidden print:block text-xs font-bold mt-1 uppercase text-black">* {expiry.label}</div>}
                        </td>
                        <td className="px-6 py-4 print:py-2 print:px-2 print:border">
                          <div className="flex items-center">
                            <span className={cn("text-lg font-black mr-2 print:text-black", isCritical ? "text-red-600" : "text-blue-600")}>{reagent.current_stock}</span>
                            <span className="text-xs text-muted-foreground uppercase font-bold print:text-gray-700">{reagent.unit}</span>
                          </div>
                          <div className="mt-1 flex flex-col gap-0.5 print:text-gray-600">
                            <div className="text-[10px] text-slate-500 flex items-center print:text-xs print:text-gray-700">Conso moy: {dailyConsumption.toFixed(1)}/j</div>
                            {isCritical ? (
                              <div className="text-[10px] text-red-600 font-bold print:text-xs print:text-black print:font-bold">* Alerte Seuil ({reorderPoint})</div>
                            ) : (
                              <div className="text-[10px] text-emerald-600 font-medium print:text-xs print:text-gray-700">Seuil: {reorderPoint}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 print:hidden">
                          <ReagentStockAdjustment reagentId={reagent.id} currentStock={reagent.current_stock} reagentName={reagent.name} onSuccess={fetchReagentsAndAudit} />
                        </td>
                        <td className="px-6 py-4 text-right print:hidden">
                          <div className="flex justify-end gap-1.5">
                            {isCritical && (
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-amber-600 hover:bg-amber-50" onClick={() => sendWhatsAppAlert(reagent)} title="Alerte WhatsApp">
                                <Share2 size={16} />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-blue-600 hover:bg-blue-50" onClick={() => setHistoryReagent({ id: reagent.id, name: reagent.name })}>
                              <History size={18} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={5} className="text-center py-10 text-muted-foreground italic print:text-black">Aucun réactif en stock.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ReagentHistoryDialog reagentId={historyReagent?.id || null} reagentName={historyReagent?.name || null} isOpen={!!historyReagent} onClose={() => setHistoryReagent(null)} />

      {/* ===== STYLES D'IMPRESSION PROPRES ET SÉCURISÉS ===== */}
      <style>{`
        @media print {
          /* Cacher la barre de navigation et autres éléments d'interface globaux */
          aside, nav, header, [role="navigation"] {
            display: none !important;
          }
          /* Forcer la zone de contenu principal à prendre toute la page */
          body, main, #root, .print-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: none !important;
            background: white !important;
          }
          /* Amélioration de la lisibilité du tableau sur papier */
          .print-table th, .print-table td {
            border: 1px solid #000 !important;
            color: #000 !important;
          }
          /* Paramètres de la page d'impression */
          @page {
            margin: 1.5cm;
            size: landscape;
          }
          /* Assurer l'impression des couleurs d'arrière-plan si nécessaire (Chrome/Safari) */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReagentsPage;