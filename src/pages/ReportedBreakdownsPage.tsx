import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, User, MapPin, Clock, CheckCircle2, Loader2, Search, Eye, Filter, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WorkOrderForm from '@/components/WorkOrderForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ReportedBreakdownsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, assets(name, location, serial_number)')
      .not('reporter_name', 'is', null)
      .order('created_at', { ascending: false });

    if (error) showError("Erreur lors du chargement des pannes.");
    else setReports(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReports();

    // ABONNEMENT TEMPS RÉEL
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_orders' },
        (payload) => {
          console.log('Changement détecté:', payload);
          fetchReports(); // Rafraîchissement intelligent
          if (payload.eventType === 'INSERT' && payload.new.reporter_name) {
            showSuccess("Une nouvelle panne vient d'être signalée !");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTakeAction = (report: any) => {
    setSelectedReport(report);
    setIsEditOpen(true);
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reporter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.assets?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.assets?.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = priorityFilter === "all" || r.priority === priorityFilter;
      
      return matchesSearch && matchesPriority;
    });
  }, [reports, searchTerm, priorityFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-2xl relative">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] text-white items-center justify-center font-bold">
                {reports.filter(r => r.status === 'Ouvert').length}
              </span>
            </span>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Pannes Signalées</h1>
            <p className="text-lg text-muted-foreground">Flux d'alertes en temps réel du portail client.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl shadow-sm border">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Rechercher par déclarant, appareil, site..." 
            className="pl-10 rounded-xl border-none bg-slate-50 h-11" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="rounded-xl border-none bg-slate-50 h-11">
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Filtrer par priorité" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les priorités</SelectItem>
            <SelectItem value="Critique">Critique uniquement</SelectItem>
            <SelectItem value="Élevée">Élevée</SelectItem>
            <SelectItem value="Moyenne">Moyenne</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredReports.length > 0 ? filteredReports.map(report => (
            <Card key={report.id} className={cn(
              "rounded-2xl shadow-sm border-l-4 transition-all hover:shadow-md group",
              report.status === 'Ouvert' ? "border-l-red-500 bg-red-50/10" : "border-l-green-500"
            )}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={report.priority === 'Critique' ? 'destructive' : 'outline'} className="rounded-full uppercase text-[9px] font-black">
                        {report.priority}
                      </Badge>
                      {new Date(report.created_at).getTime() > Date.now() - 3600000 && (
                        <Badge className="bg-blue-600 text-white rounded-full text-[8px] animate-pulse">NOUVEAU</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors">{report.assets?.name}</CardTitle>
                  </div>
                  <Badge className={cn(
                    "rounded-full text-[10px] font-black uppercase",
                    report.status === 'Ouvert' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  )}>
                    {report.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-inner space-y-3">
                  <p className="text-sm italic text-slate-700 leading-relaxed">"{report.description}"</p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-[11px] font-black uppercase text-slate-500">
                    <div className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                      <User size={12} className="mr-1.5" /> {report.reporter_name}
                    </div>
                    <div className="flex items-center text-slate-400">
                      <Clock size={12} className="mr-1.5" /> {format(new Date(report.created_at), 'dd/MM/yy HH:mm', { locale: fr })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center text-muted-foreground font-medium">
                    <MapPin size={14} className="mr-1.5 text-red-400" /> {report.assets?.location}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">SN: {report.assets?.serial_number || 'N/A'}</div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl h-11 font-bold shadow-lg transition-transform active:scale-95"
                    onClick={() => handleTakeAction(report)}
                  >
                    <Eye size={18} className="mr-2" /> Gérer l'alerte
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-full text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tout est sous contrôle</h3>
              <p className="text-slate-400 font-medium max-w-xs mx-auto">Aucune panne signalée ne correspond à vos critères de recherche.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Prendre en charge la panne</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <WorkOrderForm 
              initialData={selectedReport} 
              onSuccess={() => { setIsEditOpen(false); fetchReports(); }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportedBreakdownsPage;