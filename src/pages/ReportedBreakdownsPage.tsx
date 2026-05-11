import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, User, MapPin, Clock, CheckCircle2, Loader2, Search, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WorkOrderForm from '@/components/WorkOrderForm';

const ReportedBreakdownsPage: React.FC = () => {
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

    if (error) showError("Erreur lors du chargement des pannes.");
    else setReports(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const handleTakeAction = (report: any) => {
    setSelectedReport(report);
    setIsEditOpen(true);
  };

  const filteredReports = reports.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reporter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.assets?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-2xl">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Pannes Signalées</h1>
            <p className="text-lg text-muted-foreground">Alertes directes provenant du portail client.</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Rechercher par déclarant ou appareil..." 
          className="pl-10 rounded-xl" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredReports.length > 0 ? filteredReports.map(report => (
            <Card key={report.id} className={cn(
              "rounded-2xl shadow-sm border-l-4 transition-all hover:shadow-md",
              report.status === 'Ouvert' ? "border-l-red-500 bg-red-50/10" : "border-l-green-500"
            )}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant={report.priority === 'Critique' ? 'destructive' : 'outline'} className="mb-2 rounded-full uppercase text-[9px]">
                      {report.priority}
                    </Badge>
                    <CardTitle className="text-xl font-bold">{report.assets?.name}</CardTitle>
                  </div>
                  <Badge className={cn(
                    "rounded-full",
                    report.status === 'Ouvert' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  )}>
                    {report.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-white rounded-xl border space-y-2">
                  <p className="text-sm italic text-slate-700">"{report.description}"</p>
                  <div className="flex items-center justify-between pt-2 border-t text-[11px] font-bold uppercase text-slate-500">
                    <div className="flex items-center"><User size={12} className="mr-1 text-blue-600" /> {report.reporter_name}</div>
                    <div className="flex items-center"><Clock size={12} className="mr-1" /> {format(new Date(report.created_at), 'dd/MM/yy HH:mm', { locale: fr })}</div>
                  </div>
                </div>

                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin size={14} className="mr-1" /> {report.assets?.location}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1 bg-blue-600 rounded-xl h-10 font-bold"
                    onClick={() => handleTakeAction(report)}
                  >
                    <Eye size={16} className="mr-2" /> Gérer l'alerte
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-200 mb-2" />
              <p className="text-slate-400 font-medium">Aucune panne signalée en attente.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Prendre en charge la panne</DialogTitle>
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

import { Input } from "@/components/ui/input";
export default ReportedBreakdownsPage;