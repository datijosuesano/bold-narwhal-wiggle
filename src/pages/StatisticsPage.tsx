"use client";

import React, { useState, useRef } from 'react';
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  MapPin, 
  Warehouse,
  Activity,
  RefreshCw,
  Printer,
  FileCheck2,
  Eye,
  PieChart as PieChartIcon
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

import { useStatistics } from '@/hooks/useStatistics';
import { useKpiCalculations } from '@/hooks/useKpiCalculations';
import { KPICard } from '@/components/KPICard';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart as RePie, 
  Pie,
  Legend
} from 'recharts';

const CHART_COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const StatisticsPage: React.FC = () => {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const { workOrders, interventions, assets, isLoading, error, refetch } = useStatistics(periodDays);
  const metrics = useKpiCalculations(workOrders, interventions, assets, periodDays);

  const handleConfirmPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Rapport_Statistiques_${format(new Date(), "yyyy-MM-dd")}`,
    onAfterPrint: () => setIsPreviewOpen(false),
    pageStyle: `
      @page {
        size: portrait;
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

  const renderSkeletons = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-xl" />
        </div>
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[400px] rounded-2xl" />
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    </div>
  );

  if (isLoading) return renderSkeletons();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 max-w-md mx-auto text-center">
        <div className="p-4 bg-red-50 text-red-600 rounded-full shadow-inner"><AlertTriangle size={48} /></div>
        <h2 className="text-xl font-black text-slate-900 uppercase">Erreur d'analyse</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
        <Button onClick={refetch} className="bg-blue-600 rounded-xl font-bold h-11 px-6">
          <RefreshCw size={16} className="mr-2" /> Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER ECRAN PRINCIPAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Analyses & Performance</h1>
            <p className="text-lg text-muted-foreground">Indicateurs de qualité et de fiabilité biomédicale.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* NOUVEAU BOUTON D'OUVERTURE MODALE */}
          <Button 
            onClick={() => setIsPreviewOpen(true)} 
            variant="outline" 
            className="rounded-xl h-11 font-bold text-xs bg-white border-slate-200 shadow-sm hover:bg-slate-50 shrink-0"
          >
            <FileCheck2 size={16} className="mr-1.5 text-blue-600" /> Aperçu & Exporter
          </Button>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm h-11">
            <CalendarIcon className="text-slate-400 shrink-0" size={16} />
            <Select value={String(periodDays)} onValueChange={(val) => setPeriodDays(Number(val))}>
              <SelectTrigger className="w-full sm:w-40 border-none bg-transparent font-bold text-xs p-0 focus:ring-0 shadow-none h-auto">
                <SelectValue placeholder="Sélectionner la période" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">90 derniers jours</SelectItem>
                <SelectItem value="180">180 derniers jours</SelectItem>
                <SelectItem value="365">1 an</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* GRILLE DES KPIS ECRAN */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Temps de Réaction Moyen" value={metrics.avgReactionTime} unit="jours" description="Délai moyen d'intervention." icon={<Clock size={18} />} borderColorClass="border-l-blue-600" iconBgClass="bg-blue-50 text-blue-600" />
        <KPICard title="MTTR (Réparation)" value={metrics.mttr} unit="h" description="Temps moyen de réparation." icon={<Activity size={18} />} borderColorClass="border-l-red-500" iconBgClass="bg-red-50 text-red-500" />
        <KPICard title="MTBF (Fiabilité)" value={metrics.mtbf} unit="h" description="Temps moyen entre pannes." icon={<TrendingUp size={18} />} borderColorClass="border-l-green-500" iconBgClass="bg-green-50 text-green-500" />
        <KPICard title="Disponibilité Globale" value={metrics.availability} unit="%" description="Taux d'opérationnalité." icon={<CheckCircle2 size={18} />} borderColorClass="border-l-purple-600" iconBgClass="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-md bg-white border-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-[10px] font-black uppercase text-slate-400">Taux Maintenance Préventive</p><p className="text-2xl font-black text-slate-800 mt-1">{metrics.preventiveRate}%</p></div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full">ISO 9001</Badge>
          </CardContent>
        </Card>
        <Card className="shadow-md bg-white border-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-[10px] font-black uppercase text-slate-400">Interventions Réalisées</p><p className="text-2xl font-black text-slate-800 mt-1">{metrics.totalInterventions}</p></div>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full">Activité</Badge>
          </CardContent>
        </Card>
        <Card className="shadow-md bg-white border-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-[10px] font-black uppercase text-slate-400">Ordres de Travail Émis</p><p className="text-2xl font-black text-slate-800 mt-1">{metrics.totalOTs}</p></div>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 rounded-full">Flux</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-xl border-none bg-white rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2"><Warehouse size={20} className="text-purple-600" /> Logistique d'Intervention</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] w-full flex items-center justify-center">
            {metrics.byPlace.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <RePie>
                  <Pie data={metrics.byPlace} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {metrics.byPlace.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </RePie>
              </ResponsiveContainer>
            ) : (<p className="text-xs text-slate-400 italic">Aucune donnée logistique.</p>)}
          </CardContent>
        </Card>

        <Card className="shadow-xl border-none bg-white rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2"><PieChartIcon size={20} className="text-blue-600" /> Mix de Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] w-full flex items-center justify-center">
            {metrics.byType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <RePie>
                  <Pie data={metrics.byType} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {metrics.byType.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </RePie>
              </ResponsiveContainer>
            ) : (<p className="text-xs text-slate-400 italic">Aucune donnée de mix.</p>)}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-none bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2"><MapPin size={20} className="text-blue-600" /> Activité par Établissement</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] w-full">
          {metrics.bySite.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.bySite} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#475569' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                  {metrics.bySite.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (<div className="flex items-center justify-center h-full text-xs text-slate-400 italic">Aucune intervention.</div>)}
        </CardContent>
      </Card>

      {/* MODALE D'APERÇU WYSIWYG & EXPORT PDF */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col rounded-2xl p-0 overflow-hidden bg-slate-50">
          <DialogHeader className="p-6 bg-white border-b shrink-0 shadow-sm z-10">
            <DialogTitle className="flex items-center text-xl font-black text-slate-800">
              <Eye className="w-5 h-5 mr-2 text-blue-600" /> Aperçu du Rapport Statistique
            </DialogTitle>
            <DialogDescription>
              Vérifiez la mise en page des indicateurs biomédicaux avant d'exporter en PDF.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 bg-slate-200 flex justify-center custom-scrollbar">
            {/* GABARIT D'IMPRESSION DÉDIÉ */}
            <div ref={printRef} className="bg-white p-10 shadow-lg border w-full max-w-[850px] min-h-[900px]">
              
              {/* EN-TÊTE DU DOCUMENT */}
              <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-8">
                <div>
                  <h1 className="text-3xl font-black uppercase text-black tracking-tight">Rapport de Performance</h1>
                  <p className="text-sm font-bold text-gray-700 mt-1">
                    Département d'Ingénierie Biomédicale
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-blue-600 uppercase">BioPulse GMAO</p>
                  <p className="text-xs font-mono mt-1 text-gray-600">
                    Période d'analyse : {periodDays} jours <br/>
                    Édité le {format(new Date(), 'dd/MM/yyyy à HH:mm')}
                  </p>
                </div>
              </div>

              {/* SECTION 1: KPIS MAJEURS */}
              <h2 className="text-lg font-bold text-black border-b border-gray-200 pb-1 mb-4 uppercase tracking-wider text-sm">1. Indicateurs de Fiabilité (KPI)</h2>
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="border-l-4 border-blue-600 pl-3 py-2 bg-gray-50 rounded-r-lg">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Temps de Réaction</p>
                  <p className="text-xl font-black text-black">{metrics.avgReactionTime} <span className="text-xs font-normal">jours</span></p>
                </div>
                <div className="border-l-4 border-red-500 pl-3 py-2 bg-gray-50 rounded-r-lg">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">MTTR</p>
                  <p className="text-xl font-black text-black">{metrics.mttr} <span className="text-xs font-normal">h</span></p>
                </div>
                <div className="border-l-4 border-green-500 pl-3 py-2 bg-gray-50 rounded-r-lg">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">MTBF</p>
                  <p className="text-xl font-black text-black">{metrics.mtbf} <span className="text-xs font-normal">h</span></p>
                </div>
                <div className="border-l-4 border-purple-600 pl-3 py-2 bg-gray-50 rounded-r-lg">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Disponibilité</p>
                  <p className="text-xl font-black text-black">{metrics.availability} <span className="text-xs font-normal">%</span></p>
                </div>
              </div>

              {/* SECTION 2: VOLUME D'ACTIVITE */}
              <h2 className="text-lg font-bold text-black border-b border-gray-200 pb-1 mb-4 uppercase tracking-wider text-sm mt-8">2. Volume d'Activité</h2>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="border border-gray-200 p-4 rounded-xl text-center">
                  <p className="text-3xl font-black text-blue-700">{metrics.totalInterventions}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Interventions réalisées</p>
                </div>
                <div className="border border-gray-200 p-4 rounded-xl text-center">
                  <p className="text-3xl font-black text-purple-700">{metrics.totalOTs}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Ordres de travail émis</p>
                </div>
                <div className="border border-gray-200 p-4 rounded-xl text-center">
                  <p className="text-3xl font-black text-emerald-700">{metrics.preventiveRate}%</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Taux Préventif</p>
                </div>
              </div>

              {/* SECTION 3: REPARTITION GRAPHIQUE */}
              <h2 className="text-lg font-bold text-black border-b border-gray-200 pb-1 mb-4 uppercase tracking-wider text-sm mt-8">3. Répartition Opérationnelle</h2>
              <div className="grid grid-cols-2 gap-8 mb-8">
                
                {/* Graphique Fixe 1 */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-center mb-4 uppercase">Logistique (Site vs Atelier)</p>
                  <div className="h-[200px] w-full">
                    {metrics.byPlace.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RePie>
                          <Pie data={metrics.byPlace} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {metrics.byPlace.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                          </Pie>
                        </RePie>
                      </ResponsiveContainer>
                    ) : (<p className="text-xs text-center text-gray-400 mt-10">Données insuffisantes</p>)}
                  </div>
                </div>

                {/* Graphique Fixe 2 */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-center mb-4 uppercase">Mix (Préventif vs Correctif)</p>
                  <div className="h-[200px] w-full">
                    {metrics.byType.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RePie>
                          <Pie data={metrics.byType} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {metrics.byType.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />)}
                          </Pie>
                        </RePie>
                      </ResponsiveContainer>
                    ) : (<p className="text-xs text-center text-gray-400 mt-10">Données insuffisantes</p>)}
                  </div>
                </div>

              </div>

              {/* PIED DE PAGE PDF */}
              <div className="mt-16 pt-4 border-t border-gray-300 flex justify-between text-xs text-gray-500">
                <p>Analyse de données générée automatiquement par BioPulse.</p>
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
    </div>
  );
};

export default StatisticsPage;