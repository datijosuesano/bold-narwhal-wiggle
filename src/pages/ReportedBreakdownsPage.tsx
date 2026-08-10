import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, User, MapPin, Clock, Loader2, Search, Eye, UserCheck, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import WorkOrderForm from '@/components/WorkOrders/WorkOrderForm';
import { useAuth } from '@/contexts/AuthContext';

interface Asset {
  name: string;
  location: string;
  serial_number: string;
}

interface WorkOrder {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  reporter_name: string | null;
  created_at: string;
  assets?: Asset | null;
}

const ReportedBreakdownsPage: React.FC = () => {
  const { user, hasRole, role } = useAuth();
  const canValidate = hasRole(['admin']);
  
  const [reports, setReports] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<WorkOrder | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('work_orders')
        .select('*, assets(name, location, serial_number)')
        .not('reporter_name', 'is', null);

      // Gestion des filtres selon le rôle utilisateur
      if (role === 'technicien_biomedical') {
        query = query.eq('assigned_to', user.id);
      } else if (role === 'secretaire') { // Rôle administratif
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data as unknown as WorkOrder[]) || []);
    } catch (err: any) {
      console.error(err);
      showError("Erreur lors du chargement des pannes signalées.");
    } finally {
      setIsLoading(false);
    }
  }, [user, role]);

  useEffect(() => { 
    fetchReports(); 
  }, [fetchReports]);

  const handleTakeAction = useCallback((report: WorkOrder) => {
    setSelectedReport(report);
    setIsEditOpen(true);
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const titleMatch = r.title.toLowerCase().includes(searchTerm.toLowerCase());
      const reporterMatch = (r.reporter_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const assetMatch = (r.assets?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return titleMatch || reporterMatch || assetMatch;
    });
  }, [reports, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-red-100 rounded-2xl relative">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">Flux des Pannes</h1>
          <p className="text-lg text-muted-foreground">Étape 1 : Réception et Validation par le Responsable.</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Rechercher une alerte..." 
          className="pl-10 rounded-xl bg-white border-none shadow-sm h-11" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="p-8 text-center border border-dashed rounded-2xl bg-white shadow-sm max-w-md mx-auto">
          <AlertTriangle className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-bold">Aucune panne signalée.</p>
          <p className="text-xs text-slate-400 mt-1">Les déclarations de pannes des clients apparaîtront ici.</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredReports.map(report => {
            const rawDescription = report.description || '';
            const cleanDescription = rawDescription.includes(']')
              ? rawDescription.split(']')[1]
              : rawDescription;

            return (
              <Card key={report.id} className={cn(
                "rounded-2xl shadow-sm border-l-4 overflow-hidden transition-all hover:shadow-md bg-white",
                report.status === 'Ouvert' ? "border-l-red-500" : "border-l-blue-500"
              )}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Badge variant={report.priority === 'Critique' ? 'destructive' : 'outline'} className="rounded-full text-[9px] uppercase font-black">
                        {report.priority}
                      </Badge>
                      <CardTitle className="text-xl font-bold text-slate-900">{report.assets?.name || 'Équipement inconnu'}</CardTitle>
                    </div>
                    {report.status === 'Ouvert' ? (
                      <Badge className="bg-red-600 text-white rounded-full text-[10px] animate-pulse">A VALIDER</Badge>
                    ) : (
                      <Badge className="bg-blue-600 text-white rounded-full text-[10px] flex items-center gap-1">
                        <UserCheck size={10} /> {report.status === 'En cours' ? 'AFFECTÉ' : report.status}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                    <p className="text-sm italic text-slate-700 leading-relaxed">"{cleanDescription}"</p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-[10px] font-black uppercase text-slate-500">
                      <div className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                        <User size={12} className="mr-1.5" /> {report.reporter_name || 'Anonyme'}
                      </div>
                      <div className="flex items-center text-slate-400">
                        <Clock size={12} className="mr-1.5" /> {format(new Date(report.created_at), 'dd/MM/yy HH:mm', { locale: fr })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground font-medium">
                    <MapPin size={14} className="mr-1.5 text-red-400" /> {report.assets?.location || 'Non spécifiée'}
                  </div>

                  {canValidate ? (
                    <Button 
                      className={cn(
                        "w-full rounded-xl h-11 font-bold shadow-lg text-white",
                        report.status === 'Ouvert' ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                      )}
                      onClick={() => handleToggleActive && handleTakeAction(report)}
                    >
                      {report.status === 'Ouvert' ? <ShieldCheck size={18} className="mr-2" /> : <Eye size={18} className="mr-2" />}
                      {report.status === 'Ouvert' ? "Valider & Affecter" : "Gérer le flux"}
                    </Button>
                  ) : (
                    <div className="text-center p-2 bg-slate-100 rounded-xl text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Accès en lecture seule
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODALE DE RE-ROUTAGE ET VALIDATION RÉSERVÉE AUX RESPONSABLES */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Validation Responsable</DialogTitle>
            <DialogDescription>Validez la panne et affectez un technicien pour passer à l'étape suivante.</DialogDescription>
          </DialogHeader>
          {selectedReport && canValidate && (
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