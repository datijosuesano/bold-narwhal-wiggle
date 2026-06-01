import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, User, MapPin, Clock, CheckCircle2, Loader2, Search, Eye, Filter, UserCheck, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import WorkOrderForm from '@/components/WorkOrderForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';

const ReportedBreakdownsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['admin']);
  
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, assets(name, location, serial_number)')
      .not('reporter_name', 'is', null)
      .order('created_at', { ascending: false });

    if (error) showError("Erreur chargement.");
    else setReports(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const handleTakeAction = (report: any) => {
    setSelectedReport(report);
    setIsEditOpen(true);
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => 
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reporter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.assets?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div> : 
        filteredReports.map(report => (
          <Card key={report.id} className={cn(
            "rounded-2xl shadow-sm border-l-4 overflow-hidden transition-all hover:shadow-md",
            report.status === 'Ouvert' ? "border-l-red-500 bg-red-50/5" : "border-l-blue-500 bg-blue-50/5"
          )}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <Badge variant={report.priority === 'Critique' ? 'destructive' : 'outline'} className="rounded-full text-[9px] uppercase font-black">
                    {report.priority}
                  </Badge>
                  <CardTitle className="text-xl font-bold">{report.assets?.name}</CardTitle>
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
              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-inner">
                <p className="text-sm italic text-slate-700 leading-relaxed">"{report.description?.split(']')[1] || report.description}"</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-[10px] font-black uppercase text-slate-500">
                  <div className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                    <User size={12} className="mr-1.5" /> {report.reporter_name}
                  </div>
                  <div className="flex items-center text-slate-400">
                    <Clock size={12} className="mr-1.5" /> {format(new Date(report.created_at), 'dd/MM/yy HH:mm', { locale: fr })}
                  </div>
                </div>
              </div>

              <div className="flex items-center text-xs text-muted-foreground font-medium">
                <MapPin size={14} className="mr-1.5 text-red-400" /> {report.assets?.location}
              </div>

              <Button 
                className={cn(
                  "w-full rounded-xl h-11 font-bold shadow-lg",
                  report.status === 'Ouvert' ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                )}
                onClick={() => handleTakeAction(report)}
              >
                {report.status === 'Ouvert' ? <ShieldCheck size={18} className="mr-2" /> : <Eye size={18} className="mr-2" />}
                {report.status === 'Ouvert' ? "Valider & Affecter" : "Gérer le flux"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Validation Responsable</DialogTitle>
            <DialogDescription>Validez la panne et affectez un technicien pour passer à l'étape suivante.</DialogDescription>
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