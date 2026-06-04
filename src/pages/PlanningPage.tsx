"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  CalendarDays, 
  Plus, 
  CheckCircle2, 
  Loader2, 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown, 
  Factory, 
  Activity, 
  Wrench,
  Percent,
  CheckCircle
} from "lucide-react";
import CalendarView from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CreateWorkOrderForm from "@/components/CreateWorkOrderForm";
import CloseInterventionDialog from "@/components/CloseInterventionDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isBefore, startOfDay, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

interface ScheduledEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Maintenance Corrective' | 'Maintenance Préventive' | 'Inspection';
  priority: 'Faible' | 'Moyenne' | 'Élevée' | 'Critique';
  isCompleted: boolean;
  asset_id: string;
  assetName: string;
  assetBrand?: string;
  location: string; // Site
  clientName: string; // Client global
  assigned_to?: string | null;
  technicianName?: string;
}

const PlanningPage: React.FC = () => {
  const { hasRole, user } = useAuth();
  const canEdit = hasRole(['admin', 'technicien biomedical']);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [selectedWO, setSelectedWO] = useState<any | null>(null);

  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

  const fetchEventsAndTechs = async () => {
    setIsLoading(true);
    try {
      // 1. Charger les techniciens
      const { data: techsData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('last_name');
      
      const mappedTechs = (techsData || []).map(t => ({
        id: t.id,
        name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || 'Tech'
      }));
      setTechnicians(mappedTechs);

      const techMap = new Map(mappedTechs.map(t => [t.id, t.name]));

      // 2. Charger les ordres de travail avec jointures sur les assets et clients
      // assets(location) correspond au site. client_id dans assets lie au client global.
      const { data: woData, error } = await supabase
        .from('work_orders')
        .select('*, assets(name, brand, location, clients(name))')
        .order('due_date', { ascending: true });

      if (error) throw error;

      const mappedEvents: ScheduledEvent[] = (woData || []).map(ot => {
        const clientName = ot.assets?.clients?.name || ot.assets?.location || "Client non spécifié";
        const siteName = ot.assets?.location || "Site non spécifié";

        return {
          id: ot.id,
          title: ot.title,
          date: new Date(ot.due_date),
          type: ot.maintenance_type === 'Preventive' || ot.maintenance_type === 'Préventive' ? 'Maintenance Préventive' : 'Maintenance Corrective',
          priority: ot.priority || 'Moyenne',
          isCompleted: ot.status === 'Completed' || ot.status === 'Terminé',
          asset_id: ot.asset_id,
          assetName: ot.assets?.name || 'Équipement inconnu',
          assetBrand: ot.assets?.brand || undefined,
          location: siteName,
          clientName: clientName,
          assigned_to: ot.assigned_to,
          technicianName: ot.assigned_to ? techMap.get(ot.assigned_to) || "Technicien inconnu" : undefined
        };
      });

      setEvents(mappedEvents);

      // Auto-expand all clients containing events by default
      const initialExpands: Record<string, boolean> = {};
      mappedEvents.forEach(e => {
        initialExpands[e.clientName] = true;
      });
      setExpandedClients(initialExpands);

    } catch (err: any) {
      console.error("Erreur de chargement planning:", err);
      showError("Erreur lors de la récupération des données.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAndTechs();
  }, []);

  // Clôture d'un événement
  const handleOpenCloseDialog = (eventId: string) => {
    const rawWO = events.find(e => e.id === eventId);
    if (rawWO) {
      setSelectedWO({
        id: rawWO.id,
        title: rawWO.title,
        asset_id: rawWO.asset_id,
        maintenance_type: rawWO.type === 'Maintenance Préventive' ? 'Préventive' : 'Corrective',
        assigned_to: rawWO.assigned_to,
        assets: {
          name: rawWO.assetName
        }
      });
      setIsCloseDialogOpen(true);
    }
  };

  // Assignation rapide d'un technicien depuis le planning
  const handleQuickAssign = async (eventId: string, techId: string) => {
    try {
      const assignedValue = techId === "none" ? null : techId;
      const targetStatus = assignedValue ? 'En cours' : 'Ouvert';

      const { error } = await supabase
        .from('work_orders')
        .update({
          assigned_to: assignedValue,
          status: targetStatus,
          assigned_at: assignedValue ? new Date().toISOString() : null
        })
        .eq('id', eventId);

      if (error) throw error;
      showSuccess("Technicien affecté avec succès !");
      fetchEventsAndTechs();
    } catch (err: any) {
      showError(`Impossible d'attribuer la tâche : ${err.message}`);
    }
  };

  const toggleClientExpand = (client: string) => {
    setExpandedClients(prev => ({ ...prev, [client]: !prev[client] }));
  };

  // ==========================================
  // CALCULS DES KPIS MULTI-CLIENTS & RETARDS
  // ==========================================
  const kpis = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const startM = startOfMonth(new Date());
    const endM = endOfMonth(new Date());

    let activeToday = 0;
    let overdueCount = 0;
    let preventives = 0;
    let correctives = 0;
    let completedInMonth = 0;
    let totalInMonth = 0;

    events.forEach(e => {
      const eventDay = startOfDay(e.date);

      // 1. Aujourd'hui
      if (isToday(e.date)) {
        activeToday++;
      }

      // 2. En retard (due_date < aujourd'hui ET non complété)
      if (!e.isCompleted && isBefore(eventDay, todayStart)) {
        overdueCount++;
      }

      // Statistiques sur le mois en cours
      if (e.date >= startM && e.date <= endM) {
        totalInMonth++;
        if (e.isCompleted) completedInMonth++;

        if (e.type === 'Maintenance Préventive') preventives++;
        else preventives++; // Fallback ou autre
      }

      // Correctifs globaux actifs
      if (e.type === 'Maintenance Corrective') {
        correctives++;
      }
    });

    const completionRate = totalInMonth > 0 ? Math.round((completedInMonth / totalInMonth) * 100) : 0;

    return {
      activeToday,
      overdueCount,
      preventives,
      correctives,
      completionRate
    };
  }, [events]);

  // ==========================================
  // SEGMENTATION MULTI-CLIENTS DES TÂCHES
  // ==========================================
  const groupedEvents = useMemo(() => {
    const groups: Record<string, Record<string, ScheduledEvent[]>> = {};

    events.forEach(e => {
      if (!groups[e.clientName]) {
        groups[e.clientName] = {};
      }
      if (!groups[e.clientName][e.location]) {
        groups[e.clientName][e.location] = [];
      }
      groups[e.clientName][e.location].push(e);
    });

    return groups;
  }, [events]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <CalendarDays className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Suivi de Planification</h1>
            <p className="text-lg text-muted-foreground">Gestion d'interventions biomédicales terrain (FSM) multi-clients.</p>
          </div>
        </div>

        {canEdit && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 h-12 rounded-xl shadow-lg font-bold">
                <Plus className="mr-2 h-5 w-5" /> Programmer une action
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Programmer un Ordre de Travail</DialogTitle>
              </DialogHeader>
              <CreateWorkOrderForm onSuccess={() => { setIsModalOpen(false); fetchEventsAndTechs(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* KPI BOARD FSM */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm border-l-4 border-l-blue-600 bg-white">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <Activity size={12} className="text-blue-600" /> Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-slate-800">{kpis.activeToday}</div>
            <p className="text-[9px] text-muted-foreground">Tâches prévues ce jour</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-red-500 bg-white">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 text-red-500">
              <AlertTriangle size={12} className="text-red-500 animate-pulse" /> En Retard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-red-600">{kpis.overdueCount}</div>
            <p className="text-[9px] text-red-400 font-bold">Délai d'action dépassé</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500 bg-white">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <Wrench size={12} className="text-green-500" /> Préventives
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-slate-800">{kpis.preventives}</div>
            <p className="text-[9px] text-muted-foreground">Maintenances programmées</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-amber-500 bg-white">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-amber-500" /> Correctives
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-slate-800">{kpis.correctives}</div>
            <p className="text-[9px] text-muted-foreground">Demandes de dépannage</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-indigo-600 bg-white col-span-2 lg:col-span-1">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <Percent size={12} className="text-indigo-600" /> Taux de Réalisation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-indigo-700">{kpis.completionRate}%</div>
            <p className="text-[9px] text-muted-foreground">Clôtures ce mois-ci</p>
          </CardContent>
        </Card>
      </div>

      {/* CORE GRID : CALENDRIER À DROITE / LISTE METIER STRUCTURÉE À GAUCHE */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* COLONNE GAUCHE (7/12) : PIPELINE DE SUIVI PAR CLIENT & SITE */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-xl border-none bg-white rounded-2xl">
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-black flex items-center text-slate-900 uppercase tracking-tight">
                    <ClipboardList size={18} className="mr-2 text-blue-600" /> Flux d'Interventions Terrain
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Suivi multi-sites géolocalisé pour l'équipe itinérante.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-white rounded-full font-bold">
                  {events.filter(e => !e.isCompleted).length} active(s)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>
              ) : Object.keys(groupedEvents).length > 0 ? (
                Object.entries(groupedEvents).map(([client, sites]) => {
                  const isExpanded = !!expandedClients[client];
                  const totalClientEvents = Object.values(sites).flat().length;
                  const activeClientEvents = Object.values(sites).flat().filter(e => !e.isCompleted).length;

                  return (
                    <div key={client} className="border rounded-2xl bg-white shadow-sm overflow-hidden transition-all">
                      {/* En-tête Client */}
                      <button 
                        onClick={() => toggleClientExpand(client)}
                        className="w-full p-4 flex items-center justify-between bg-slate-50/80 hover:bg-slate-50 transition-colors border-b"
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                            <Factory size={16} />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 leading-tight">{client}</h4>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {Object.keys(sites).length} site(s) rattaché(s)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {activeClientEvents > 0 && (
                            <Badge className="bg-blue-600 text-white font-bold text-[9px]">
                              {activeClientEvents} active(s)
                            </Badge>
                          )}
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      </button>

                      {/* Sites & Tâches associées */}
                      {isExpanded && (
                        <div className="p-4 space-y-4 divide-y divide-slate-100">
                          {Object.entries(sites).map(([site, siteEvents]) => (
                            <div key={site} className="pt-3 first:pt-0 space-y-3">
                              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                                <MapPin size={12} className="mr-1.5 text-red-500" /> {site}
                              </h5>

                              <div className="space-y-3">
                                {siteEvents.map(event => {
                                  const isOverdue = !event.isCompleted && isBefore(startOfDay(event.date), startOfDay(new Date()));
                                  return (
                                    <div key={event.id} className={cn(
                                      "p-4 rounded-xl border bg-slate-50/30 flex flex-col gap-3 relative hover:shadow-md hover:border-slate-300 transition-all",
                                      event.isCompleted && "border-green-100 bg-green-50/5",
                                      isOverdue && "border-red-200 bg-red-50/10 animate-pulse-slow"
                                    )}>
                                      
                                      {/* Contenu principal de la tâche */}
                                      <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1 flex-1">
                                          <div className="flex gap-2 items-center flex-wrap">
                                            <Badge variant="outline" className={cn(
                                              "text-[9px] uppercase font-black px-2",
                                              event.priority === "Critique" ? "bg-red-500 text-white border-red-500" :
                                              event.priority === "Élevée" ? "bg-red-50 text-red-700 border-red-200" :
                                              "bg-slate-100 text-slate-700"
                                            )}>
                                              {event.priority}
                                            </Badge>
                                            
                                            {isOverdue && (
                                              <Badge className="bg-red-600 text-white font-black text-[9px] rounded px-2">
                                                EN RETARD
                                              </Badge>
                                            )}

                                            <span className="text-[10px] text-muted-foreground font-semibold flex items-center">
                                              <Clock size={10} className="mr-1" />
                                              Planifié le {format(event.date, 'dd/MM/yyyy')}
                                            </span>
                                          </div>

                                          <h6 className={cn("text-xs font-bold leading-tight text-slate-800", event.isCompleted && "line-through text-slate-400")}>
                                            {event.title}
                                          </h6>

                                          <p className="text-[10px] text-blue-600 font-bold mt-1">
                                            {event.assetName} {event.assetBrand && <span className="text-slate-400 font-medium ml-1">({event.assetBrand})</span>}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Assignation & Clôture */}
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2.5 border-t border-slate-200/50">
                                        
                                        {/* Sélecteur de technicien rapide */}
                                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                          <User size={12} className="text-slate-400" />
                                          <Select 
                                            defaultValue={event.assigned_to || "none"}
                                            onValueChange={(val) => handleQuickAssign(event.id, val)}
                                            disabled={!canEdit || event.isCompleted}
                                          >
                                            <SelectTrigger className="h-8 text-[11px] rounded-lg border-slate-200 bg-white min-w-[150px]">
                                              <SelectValue placeholder="Non affecté" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                              <SelectItem value="none">-- Non affecté --</SelectItem>
                                              {technicians.map(t => (
                                                <SelectItem key={t.id} value={t.id} className="text-[11px]">
                                                  {t.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* Actions */}
                                        {!event.isCompleted ? (
                                          <Button 
                                            size="sm" 
                                            onClick={() => handleOpenCloseDialog(event.id)}
                                            className="h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] uppercase tracking-wider w-full sm:w-auto shrink-0"
                                          >
                                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Clôturer
                                          </Button>
                                        ) : (
                                          <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg text-[9px] font-black uppercase py-1 px-2.5 self-start sm:self-auto">
                                            RIT Archivée
                                          </Badge>
                                        )}

                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 text-muted-foreground italic border-2 border-dashed rounded-2xl">
                  Aucun ordre de travail planifié pour le moment.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLONNE DROITE (7/12) : CALENDRIER MENSUEL MENÉ PAR LA TECHNIQUE */}
        <div className="lg:col-span-7">
          <CalendarView events={events} onCompleteEvent={handleCompleteEvent} />
        </div>

      </div>

      {/* MODALE DE CLÔTURE PROFESSIONNELLE (FSM) */}
      <CloseInterventionDialog 
        isOpen={isCloseDialogOpen}
        onClose={() => setIsCloseDialogOpen(false)}
        workOrder={selectedWO}
        onSuccess={fetchEventsAndTechs}
      />
    </div>
  );
};

export default PlanningPage;