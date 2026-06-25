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
  Hash,
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

  // 1. Référence pour l'impression
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

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const date = new Date(expiryDate);
    const today = new Date();
    const daysLeft = differenceInDays(date, today);

    if (isBefore(date, today)) return { label: "PÉRIMÉ (REBUT)", class: "bg-red-600 text-white animate-pulse", critical: true };
    if (daysLeft <= 180) return { label: `Expire dans ${daysLeft} j`, class: "bg-amber-500 text-white font-bold", critical: true };
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

  const filteredReagents = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return reagents;
    return reagents.filter(r => r.name.toLowerCase().includes(term) || r.reference.toLowerCase().includes(term));
  }, [reagents, searchTerm]);

  // 2. Configuration de react-to-print
  const handleConfirmPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Inventaire_Reactifs_${format(new Date(), "yyyy-MM-dd")}`,
    onAfterPrint: () => setIsPreviewOpen(false), // Ferme la modale automatiquement après impression
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

      {/* GRAPHIQUE ET AUDIT ECRAN */}
      <div className="grid gap-8 lg:grid-cols-12">
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
              <p className="text-xs text-slate-400 italic">Aucune sortie enregistrée.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xl border-none bg-white rounded-2xl lg:col-span-7 flex flex-col justify-between">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-black flex items-center text-slate-900 uppercase tracking-tight">
              <Database size={18} className="mr-2 text-emerald-600" /> Registre d'Audit
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

      {/* TABLE ECRAN PRINCIPALE */}
      <Card className="shadow-lg overflow-hidden border-none bg-white rounded-2xl">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <FlaskConical size={16} className="text-blue-600" /> Inventaire & Pilotage des Stocks
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Rechercher par nom ou référence..." className="pl-10 rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground border-b">
                <tr>
                  <th className="px-6 py-4">Produit / Réf</th>
                  <th className="px-6 py-4">Péremption</th>
                  <th className="px-6 py-4">Niveau de Stock</th>
                  <th className="px-6 py-4">Ajustement</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-10"><Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600" /></td></tr>
                ) : filteredReagents.length > 0 ? (
                  filteredReagents.map((reagent) => {
                    const expiry = getExpiryStatus(reagent.expiry_date);
                    const { isCritical, dailyConsumption, reorderPoint } = calculateStockStatus(reagent);
                    return (
                      <tr key={reagent.id} className={cn("hover:bg-accent/50 transition-colors", isCritical && "bg-amber-50/20")}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">
                            {reagent.name}
                          </div>

                          <div className="text-[10px] font-mono text-slate-400 uppercase">
                            Ref: {reagent.reference}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold">{reagent.expiry_date ? format(new Date(reagent.expiry_date), "dd/MM/yyyy") : "---"}</div>
                          {expiry && <Badge className={cn("mt-1 rounded-full text-[9px] font-bold text-white", expiry.class)}>{expiry.label}</Badge>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className={cn("text-lg font-black mr-2", isCritical ? "text-red-600" : "text-blue-600")}>{reagent.current_stock}</span>
                            <span className="text-xs text-muted-foreground uppercase font-bold">{reagent.unit}</span>
                          </div>
                          <div className="mt-1 flex flex-col gap-0.5">
                            <div className="text-[10px] text-slate-500 flex items-center"><Activity size={10} className="mr-1 text-slate-400"/> Conso moy: {dailyConsumption.toFixed(1)}/j</div>
                            {isCritical ? (
                              <div className="text-[10px] text-red-600 font-bold">⚠️ Alerte Seuil ({reorderPoint})</div>
                            ) : (
                              <div className="text-[10px] text-emerald-600 font-medium">Seuil: {reorderPoint}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <ReagentStockAdjustment reagentId={reagent.id} currentStock={reagent.current_stock} reagentName={reagent.name} onSuccess={fetchReagentsAndAudit} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {isCritical && (
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-amber-600 hover:bg-amber-50" onClick={() => sendWhatsAppAlert(reagent)}>
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
                  <tr><td colSpan={5} className="text-center py-10 text-muted-foreground italic">Aucun réactif en stock.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODALE D'APERÇU WYSIWYG & EXPORT */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col rounded-2xl p-0 overflow-hidden bg-slate-50">
          <DialogHeader className="p-6 bg-white border-b shrink-0 shadow-sm z-10">
            <DialogTitle className="flex items-center text-xl font-black text-slate-800">
              <Eye className="w-5 h-5 mr-2 text-blue-600" /> Aperçu du Document Final
            </DialogTitle>
            <DialogDescription>
              Vérifiez la mise en page avant d'exporter en PDF ou d'imprimer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 bg-slate-200 flex justify-center custom-scrollbar">
            
            {/* 3. Le Container attachée à react-to-print */}
            <div 
              ref={printRef} 
              className="bg-white p-10 shadow-lg border w-full max-w-[1000px] min-h-[700px]"
            >
              <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
                <div>
                  <h1 className="text-2xl font-black uppercase text-black tracking-tight">Rapport d'Inventaire</h1>
                  <p className="text-sm font-bold text-gray-700">État du stock des réactifs biologiques</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-blue-600 uppercase">BioPulse GMAO</p>
                  <p className="text-xs font-mono mt-1 text-gray-500">Édité le {format(new Date(), 'dd/MM/yyyy à HH:mm')}</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 border-b-2 border-black">
                  <tr>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Produit</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Péremption</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Niveau de Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {filteredReagents.map((reagent) => {
                    const expiry = getExpiryStatus(reagent.expiry_date);
                    const { isCritical, dailyConsumption, reorderPoint } = calculateStockStatus(reagent);
                    return (
                      <tr key={reagent.id} className={cn(isCritical && "bg-amber-50/40")}>
                        <td className="py-3 px-3 border border-gray-300">
                          <div className="font-bold text-black text-sm">{reagent.name}</div>
                          <div className="text-xs mt-1 text-gray-600 font-mono">
                            Ref: {reagent.reference} | Lot: {reagent.lot_number || "N/A"}
                          </div>
                        </td>
                        <td className="py-3 px-3 border border-gray-300">
                          <div className="text-sm font-medium text-black">{reagent.expiry_date ? format(new Date(reagent.expiry_date), "dd/MM/yyyy") : "---"}</div>
                          {expiry?.critical && <div className="text-xs font-bold mt-1 text-red-600 uppercase tracking-tight">• {expiry.label}</div>}
                        </td>
                        <td className="py-3 px-3 border border-gray-300">
                          <div className="flex items-center">
                            <span className={cn("text-lg font-black mr-2", isCritical ? "text-red-600" : "text-black")}>{reagent.current_stock}</span>
                            <span className="text-xs font-bold text-gray-600">{reagent.unit}</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Conso: {dailyConsumption.toFixed(1)}/j • {isCritical ? <span className="text-red-600 font-bold">Seuil ({reorderPoint}) dépassé</span> : <span>Seuil: {reorderPoint}</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-10 pt-4 border-t border-gray-300 flex justify-between text-xs text-gray-500">
                <p>Généré automatiquement par le système BioPulse.</p>
                <p>Page 1 sur 1</p>
              </div>
            </div>
            
          </div>

          <DialogFooter className="p-4 bg-white border-t shrink-0 flex items-center justify-between">
            <p className="text-xs text-slate-500 italic hidden sm:block">
              * Astuce : Dans la fenêtre système, choisissez "Enregistrer au format PDF".
            </p>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="ghost" className="rounded-xl font-medium" onClick={() => setIsPreviewOpen(false)}>Annuler</Button>
              <Button onClick={() => handleConfirmPrint()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md">
                <Printer className="w-4 h-4 mr-2" /> Valider & Imprimer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReagentHistoryDialog reagentId={historyReagent?.id || null} reagentName={historyReagent?.name || null} isOpen={!!historyReagent} onClose={() => setHistoryReagent(null)} />
    </div>
  );
};

export default ReagentsPage;