import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Plus,
  Search,
  FileText,
  Map,
  Filter,
  Eye,
  CheckCircle2,
  Download,
  Loader2,
  Trash2,
  Printer,
  AlertCircle,
  FileCheck,
  FileQuestion
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreateReportForm from '@/components/CreateReportForm';
import ReportPDFPreview from '@/components/ReportPDFPreview';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Interface stricte pour le modèle de données Rapport
interface Report {
  id: string;
  title: string;
  type: 'Intervention' | 'Mission';
  client: string;
  technician: string;
  date: Date;
  status: 'Draft' | 'Finalized';
  content: string;
  user_id: string;
  created_at: string;
}

const ReportsPage: React.FC = () => {
  // ==========================================
  // 1. AUTH & ROLES
  // ==========================================
  const { hasRole } = useAuth();
  const canValidate = hasRole(['admin', 'technicien_biomedical']);
  const canDelete = hasRole(['admin']);

  // ==========================================
  // 2. STATES
  // ==========================================
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Draft' | 'Finalized'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Intervention' | 'Mission'>('all');

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // ==========================================
  // 3. QUERIES (SUPABASE)
  // ==========================================
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          title,
          type,
          content,
          date,
          status,
          created_at,
          user_id,
          client_id,
          technician_id,
          clients ( name ),
          profiles:technician_id ( first_name, last_name )
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      const mappedReports: Report[] = (data || []).map((r: any) => ({
        id: r.id,
        title: r.title || "Sans titre",
        type: (r.type === 'Mission' ? 'Mission' : 'Intervention') as 'Intervention' | 'Mission',
        client: r.clients?.name || "Client non spécifié",
        technician: r.profiles ? `${r.profiles.first_name || ''} ${r.profiles.last_name || ''}`.trim() : "Technicien non spécifié",
        date: r.date ? new Date(r.date) : new Date(),
        status: r.status === 'Finalized' || r.status === 'Validé' ? 'Finalized' : 'Draft',
        content: r.content || "",
        user_id: r.user_id || "",
        created_at: r.created_at || ""
      }));

      setReports(mappedReports);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      showError("Erreur lors du chargement des rapports : " + (error.message || "Erreur inconnue"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ==========================================
  // 4. EFFECTS
  // ==========================================
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ==========================================
  // 5. HANDLERS
  // ==========================================
  const handleValidate = async (reportId: string) => {
    setValidatingId(reportId);
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'Finalized' })
        .eq('id', reportId);

      if (error) throw error;

      // Mise à jour optimiste de l'état local
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'Finalized' } : r));
      showSuccess("Rapport validé avec succès.");
    } catch (error: any) {
      console.error("Error validating report:", error);
      showError("Erreur lors de la validation : " + (error.message || "Erreur inconnue"));
    } finally {
      setValidatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedReport) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', selectedReport.id);

      if (error) throw error;

      // Mise à jour optimiste de l'état local
      setReports(prev => prev.filter(r => r.id !== selectedReport.id));
      showSuccess("Rapport supprimé avec succès.");
      setIsDeleteOpen(false);
      setSelectedReport(null);
    } catch (error: any) {
      console.error("Error deleting report:", error);
      showError("Erreur lors de la suppression : " + (error.message || "Erreur inconnue"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewPDF = (report: Report) => {
    setSelectedReport(report);
    setIsPreviewOpen(true);
  };

  const handleOpenDelete = (report: Report) => {
    setSelectedReport(report);
    setIsDeleteOpen(true);
  };

  const handleDownload = () => {
    showSuccess("Choisissez 'Enregistrer au format PDF' dans Destination pour générer le PDF.");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // ==========================================
  // 6. DERIVED DATA (MEMOIZED)
  // ==========================================
  const stats = useMemo(() => {
    const total = reports.length;
    const validated = reports.filter(r => r.status === 'Finalized').length;
    const drafts = reports.filter(r => r.status === 'Draft').length;
    return { total, validated, drafts };
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Filtre par statut
      if (statusFilter !== 'all') {
        if (statusFilter === 'Draft' && report.status !== 'Draft') return false;
        if (statusFilter === 'Finalized' && report.status !== 'Finalized') return false;
      }

      // Filtre par type
      if (typeFilter !== 'all' && report.type !== typeFilter) return false;

      // Recherche textuelle multi-critères
      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const matchesTitle = report.title.toLowerCase().includes(term);
        const matchesClient = report.client.toLowerCase().includes(term);
        const matchesTechnician = report.technician.toLowerCase().includes(term);
        const matchesType = report.type.toLowerCase().includes(term);
        const matchesStatus = (report.status === 'Finalized' ? 'validé' : 'brouillon').includes(term);
        const matchesContent = report.content.toLowerCase().includes(term);

        return matchesTitle || matchesClient || matchesTechnician || matchesType || matchesStatus || matchesContent;
      }

      return true;
    });
  }, [reports, searchTerm, statusFilter, typeFilter]);

  // ==========================================
  // 7. UI RENDERING
  // ==========================================
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <ClipboardList className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">
              Rapports d'Activité
            </h1>
            <p className="text-lg text-muted-foreground">
              Centralisation et validation des interventions multi-sites.
            </p>
          </div>
        </div>

        {/* BOUTON CRÉATION */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md h-11 font-bold">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Rapport
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Créer un Rapport</DialogTitle>
              <DialogDescription>
                Saisissez les détails de l'intervention multi-sites.
              </DialogDescription>
            </DialogHeader>
            <CreateReportForm
              onSuccess={() => {
                setIsCreateOpen(false);
                fetchReports();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* STATS CARDS */}
      <div className="grid gap-6 md:grid-cols-3 print:hidden">
        <Card className="shadow-md border-l-4 border-blue-600 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center">
              <FileText size={14} className="mr-2 text-blue-600" /> Total des Rapports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-l-4 border-green-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center">
              <FileCheck size={14} className="mr-2 text-green-500" /> Rapports Validés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">{stats.validated}</div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-l-4 border-amber-500 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center">
              <FileQuestion size={14} className="mr-2 text-amber-500" /> Rapports Brouillons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-600">{stats.drafts}</div>
          </CardContent>
        </Card>
      </div>

      {/* FILTRES ET RECHERCHE */}
      <Card className="shadow-md print:hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-bold">Journal des Rapports</CardTitle>
              <CardDescription>Documents classés par ordre chronologique.</CardDescription>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {/* Recherche textuelle */}
              <div className="relative flex-1 md:w-64 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher (Client, Objet...)"
                  className="pl-10 rounded-xl h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtre Statut */}
              <Select
                value={statusFilter}
                onValueChange={(value: any) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[140px] rounded-xl h-10">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Draft">Brouillons</SelectItem>
                  <SelectItem value="Finalized">Validés</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtre Type */}
              <Select
                value={typeFilter}
                onValueChange={(value: any) => setTypeFilter(value)}
              >
                <SelectTrigger className="w-[140px] rounded-xl h-10">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="Intervention">Intervention</SelectItem>
                  <SelectItem value="Mission">Mission</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* LISTE DES RAPPORTS */}
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? (
              <div className="text-center py-20">
                <Loader2 className="animate-spin mx-auto text-blue-600 h-10 w-10" />
                <p className="text-sm text-muted-foreground mt-2">Chargement des rapports...</p>
              </div>
            ) : filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-accent/30 transition-colors"
                >
                  {/* Infos Rapport */}
                  <div className="flex items-start space-x-4">
                    <div
                      className={cn(
                        "p-2.5 rounded-xl shrink-0",
                        report.type === 'Intervention'
                          ? "bg-blue-100 text-blue-600"
                          : "bg-purple-100 text-purple-600"
                      )}
                    >
                      {report.type === 'Intervention' ? <FileText size={20} /> : <Map size={20} />}
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground leading-tight">
                        {report.title}
                      </h4>
                      <p className="text-sm font-semibold text-blue-600">
                        {report.client}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Par {report.technician} • {format(report.date, 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Statut */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <Badge
                      variant={report.status === 'Finalized' ? "default" : "secondary"}
                      className={cn(
                        "rounded-full font-bold text-xs px-2.5 py-0.5",
                        report.status === 'Finalized'
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-amber-100 text-amber-700 border-amber-200"
                      )}
                    >
                      {report.status === 'Finalized' ? 'Validé' : 'Brouillon'}
                    </Badge>

                    <div className="flex items-center gap-1.5">
                      {/* Bouton de validation (Admin & Tech uniquement) */}
                      {report.status === 'Draft' && canValidate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-green-600 hover:bg-green-50 rounded-xl"
                          onClick={() => handleValidate(report.id)}
                          disabled={validatingId !== null}
                          title="Valider le rapport"
                        >
                          {validatingId === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 size={18} />
                          )}
                        </Button>
                      )}

                      {/* Bouton d'aperçu */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-xl"
                        onClick={() => handleViewPDF(report)}
                        title="Voir Aperçu PDF"
                      >
                        <Eye size={18} />
                      </Button>

                      {/* Bouton de suppression (Admin uniquement) */}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-xl"
                          onClick={() => handleOpenDelete(report)}
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground bg-muted/10 rounded-b-xl">
                <ClipboardList className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p className="font-medium">Aucun rapport trouvé.</p>
                <p className="text-xs text-slate-400 mt-1">Modifiez vos filtres ou créez un nouveau rapport.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PREVIEW PDF DIALOG */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto rounded-xl p-0 border-none bg-slate-100">
          <DialogHeader className="sr-only">
            <DialogTitle>Aperçu du Rapport</DialogTitle>
            <DialogDescription>Visualisation du document PDF généré.</DialogDescription>
          </DialogHeader>

          {/* TOOLBAR */}
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-50 shadow-sm print:hidden">
            <div className="flex flex-col text-left">
              <h3 className="text-lg font-bold">Aperçu du Rapport</h3>
              <p className="text-[10px] text-blue-600 font-bold">
                💡 Pour sauvegarder en PDF : Destination → Enregistrer au format PDF
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="rounded-xl h-10 font-bold"
              >
                <Printer size={18} className="mr-2" />
                Imprimer
              </Button>

              <Button
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 rounded-xl h-10 font-bold"
              >
                <Download size={18} className="mr-2" />
                Exporter PDF
              </Button>
            </div>
          </div>

          {/* PRINT AREA */}
          <div id="report-print-area" className="print-container bg-white">
            <div className="p-6 md:p-12">
              {selectedReport && (
                <ReportPDFPreview report={selectedReport} />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce rapport ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le rapport sera définitivement retiré de la base de données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={isDeleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 rounded-xl font-bold"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Confirmer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PRINT CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #report-print-area,
          #report-print-area * {
            visibility: visible !important;
          }
          #report-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .print\\:hidden,
          button,
          header,
          nav,
          aside,
          footer,
          .sticky {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 12mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;