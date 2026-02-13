import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Search, FileText, Map, Filter, Eye, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import CreateReportForm from '@/components/CreateReportForm';
import ReportPDFPreview from '@/components/ReportPDFPreview';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';

interface Report {
  id: string;
  title: string;
  type: 'Intervention' | 'Mission';
  client: string;
  technician: string;
  date: Date;
  status: 'Draft' | 'Finalized';
}

const ReportsPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      showError("Erreur lors du chargement des rapports.");
    } else {
      const mappedReports: Report[] = (data || []).map(r => ({
        ...r,
        date: new Date(r.date)
      }));
      setReports(mappedReports);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleViewPDF = (report: Report) => {
    setSelectedReport(report);
    setIsPreviewOpen(true);
  };

  const handleValidate = async (reportId: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'Finalized' })
      .eq('id', reportId);

    if (error) {
      showError("Erreur lors de la validation.");
    } else {
      showSuccess("Rapport validé avec succès.");
      fetchReports();
    }
  };

  const handleDownload = () => {
    showSuccess("Téléchargement du PDF lancé...");
  };
  
  const filteredReports = useMemo(() => {
    if (!searchTerm) return reports;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return reports.filter(report =>
      report.title.toLowerCase().includes(lowerCaseSearch) ||
      report.client.toLowerCase().includes(lowerCaseSearch) ||
      report.technician.toLowerCase().includes(lowerCaseSearch)
    );
  }, [reports, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <ClipboardList className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Rapports d'Activité</h1>
            <p className="text-lg text-muted-foreground">Centralisation des interventions multi-sites.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Nouveau Rapport
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Créer un Rapport</DialogTitle>
              <DialogDescription>Saisissez les détails de l'intervention multi-sites.</DialogDescription>
            </DialogHeader>
            <CreateReportForm onSuccess={() => { setIsCreateOpen(false); fetchReports(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg border-l-4 border-blue-500 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase">Total Interventions</CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{reports.filter(r => r.type === 'Intervention').length} Rapports</div></CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-purple-500 bg-purple-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase">Missions Externes</CardTitle>
            <Map className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{reports.filter(r => r.type === 'Mission').length} Missions</div></CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Journal des Rapports</CardTitle>
              <CardDescription>Documents classés par ordre chronologique.</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Rechercher (Client, Objet...)" 
                  className="pl-10 rounded-xl" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="rounded-xl"><Filter size={18} /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? (
              <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600 h-10 w-10" /></div>
            ) : filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <div key={report.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      report.type === 'Intervention' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                    )}>
                      {report.type === 'Intervention' ? <FileText size={20} /> : <Map size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{report.title}</h4>
                      <p className="text-sm font-medium text-blue-600">{report.client}</p>
                      <p className="text-xs text-muted-foreground">Par {report.technician} • {format(report.date, 'dd MMMM yyyy', { locale: fr })}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={report.status === 'Finalized' ? "default" : "secondary"} className={cn(
                      "rounded-full",
                      report.status === 'Finalized' ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"
                    )}>
                      {report.status === 'Finalized' ? 'Validé' : 'Brouillon'}
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      {report.status === 'Draft' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-green-600 hover:bg-green-50" 
                          onClick={() => handleValidate(report.id)}
                          title="Valider le rapport"
                        >
                          <CheckCircle2 size={18} />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-blue-600 hover:bg-blue-50" 
                        onClick={() => handleViewPDF(report)}
                        title="Voir Aperçu PDF"
                      >
                        <Eye size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground bg-muted/10">
                <ClipboardList className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p>Aucun rapport trouvé. Commencez par en créer un.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl p-0 border-none bg-slate-100">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10 shadow-sm">
            <DialogTitle className="text-lg font-bold">Aperçu du Rapport</DialogTitle>
            <Button onClick={handleDownload} className="bg-blue-600 rounded-xl">
              <Download size={18} className="mr-2" /> Télécharger PDF
            </Button>
          </div>
          <div className="p-6 md:p-12">
            {selectedReport && <ReportPDFPreview report={selectedReport} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsPage;