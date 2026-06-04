import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  Plus, 
  Search, 
  CheckCircle2, 
  Loader2, 
  Calendar, 
  MapPin, 
  Edit2, 
  Trash2, 
  FileText, 
  Receipt, 
  ChevronDown, 
  XCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Warehouse, 
  Eye, 
  FileSpreadsheet, 
  Clock,
  Briefcase,
  TrendingUp,
  AlertTriangle,
  Zap,
  CheckCircle,
  Activity,
  Package
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import AddPastInterventionForm from '@/components/AddPastInterventionForm';
import CreateReportForm from '@/components/CreateReportForm';
import InterventionDetailDialog from '@/components/InterventionDetailDialog';
import { useAuth } from '@/contexts/AuthContext';

interface Intervention {
  id: string;
  rit_number?: string | null;
  title: string;
  maintenance_type: string;
  intervention_date: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  description: string;
  asset_id: string;
  invoice_status: string;
  invoice_number: string;
  intervention_place: string;
  accessories_received?: string | null;
  client_signature_url?: string | null;
  technician_id?: string | null;
  assets: {
    name: string;
    location: string;
    brand?: string | null;
  } | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const InterventionsPage: React.FC = () => {
  const { hasRole, role } = useAuth();
  const canEdit = hasRole(['admin', 'technicien biomedical']);
  const isSec = role === 'secretaire' || role === 'admin';

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  const fetchInterventions = async () => {
    setIsLoading(true);
    // On utilise profiles!technician_id pour spécifier quelle relation de clé étrangère utiliser
    const { data, error } = await supabase
      .from('interventions')
      .select('*, assets(name, location, brand), profiles!technician_id(first_name, last_name)')
      .order('intervention_date', { ascending: false });

    if (error) {
      showError("Erreur lors du chargement de l'historique.");
      console.error("Erreur fetch interventions:", error);
    } else {
      setInterventions((data as any) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => { 
    fetchInterventions(); 
  }, []);

  const handleUpdateInvoiceStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('interventions')
      .update({ 
        invoice_status: status,
        invoice_deposited_at: status === 'Facture déposée' ? new Date().toISOString() : null
      })
      .eq('id', id);

    if (error) {
      console.error("Erreur statut:", error);
      showError(`Erreur: ${error.message}`);
    } else {
      showSuccess(`Statut mis à jour : ${status}`);
      fetchInterventions();
    }
  };

  const handleDelete = async () => {
    if (!selectedIntervention) return;
    const { error } = await supabase.from('interventions').delete().eq('id', selectedIntervention.id);
    if (error) {
      showError("Erreur lors de la suppression.");
    } else {
      showSuccess("Intervention supprimée.");
      fetchInterventions();
    }
    setIsDeleteOpen(false);
  };

  // Statut administratif (Facturation)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Facture déposée': return <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full"><CheckCircle2 size={10} className="mr-1" /> Déposée</Badge>;
      case 'Sous garantie': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full"><ShieldCheck size={10} className="mr-1" /> Garantie</Badge>;
      case 'Sous contrat': return <Badge className="bg-purple-100 text-purple-700 border-purple-200 rounded-full"><ShieldAlert size={10} className="mr-1" /> Contrat</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-full"><XCircle size={10} className="mr-1" /> Non déposée</Badge>;
    }
  };

  // Statut Technique (En attente, En cours, Terminé, Suspendu, Irréparable)
  // Déterminé de manière robuste à partir de la présence ou non de dates de clôture
  const getTechnicalStatus = (item: Intervention) => {
    const descLower = (item.description || "").toLowerCase();
    if (descLower.includes('[irréparable]') || descLower.includes('irréparable')) {
      return { label: "Irréparable", style: "bg-rose-100 text-rose-800 border-rose-200" };
    }
    if (descLower.includes('[suspendu]') || descLower.includes('suspendu')) {
      return { label: "Suspendu", style: "bg-stone-100 text-stone-800 border-stone-200" };
    }
    if (item.end_date) {
      return { label: "Terminé", style: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    }
    if (item.start_date) {
      return { label: "En cours", style: "bg-sky-100 text-sky-800 border-sky-200" };
    }
    return { label: "En attente", style: "bg-amber-100 text-amber-800 border-amber-200" };
  };

  // Durée de l'intervention
  const getDurationString = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diffMs = e - s;
    if (isNaN(diffMs) || diffMs < 0) return null;

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}j ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  // Filtrage optimisé des interventions par useMemo
  const filteredInterventions = useMemo(() => {
    return interventions.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.rit_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assets?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assets?.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [interventions, searchTerm]);

  // Statistiques & KPIs calculés de manière performante
  const kpis = useMemo(() => {
    const total = interventions.length;
    
    // Interventions de ce mois-ci
    const now = new Date();
    const currentMonthStr = format(now, 'yyyy-MM');
    const thisMonthCount = interventions.filter(item => 
      item.intervention_date && item.intervention_date.startsWith(currentMonthStr)
    ).length;

    // Sous garantie
    const underWarranty = interventions.filter(item => item.invoice_status === 'Sous garantie').length;

    // Factures déposées
    const depositedInvoices = interventions.filter(item => item.invoice_status === 'Facture déposée').length;

    // Durée moyenne d'intervention en minutes
    let totalMinutes = 0;
    let countWithDuration = 0;
    interventions.forEach(item => {
      if (item.start_date && item.end_date) {
        const s = new Date(item.start_date);
        const e = new Date(item.end_date);
        const diff = differenceInMinutes(e, s);
        if (diff > 0) {
          totalMinutes += diff;
          countWithDuration++;
        }
      }
    });

    const avgMinutes = countWithDuration > 0 ? Math.round(totalMinutes / countWithDuration) : 0;
    let avgDurationStr = "0 min";
    if (avgMinutes >= 60) {
      const h = Math.floor(avgMinutes / 60);
      const m = avgMinutes % 60;
      avgDurationStr = `${h}h ${m}m`;
    } else if (avgMinutes > 0) {
      avgDurationStr = `${avgMinutes} min`;
    }

    return { total, thisMonthCount, underWarranty, depositedInvoices, avgDurationStr };
  }, [interventions]);

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-2xl"><Wrench className="h-8 w-8 text-green-600" /></div>
            <div>
              <h1 className="text-4xl font-extrabold text-primary tracking-tight">Interventions</h1>
              <p className="text-lg text-muted-foreground">Journal historique et suivi administratif.</p>
            </div>
          </div>
          
          {canEdit && (
            <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 rounded-xl shadow-md">
                  <Plus className="mr-2 h-4 w-4" /> Enregistrer Intervention
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-xl">
                <DialogHeader>
                  <DialogTitle>Nouvelle Intervention</DialogTitle>
                  <DialogDescription>Saisissez les détails de l'action technique réalisée.</DialogDescription>
                </DialogHeader>
                <AddPastInterventionForm onSuccess={() => { setIsLogOpen(false); fetchInterventions(); }} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* SECTION KPI EN HAUT DE PAGE */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card className="shadow-sm border-l-4 border-l-blue-600 transition hover:scale-[1.02] bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                <Activity size={14} className="text-blue-600" /> Total Interventions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-800">{kpis.total}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Enregistrées dans l'historique</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-purple-600 transition hover:scale-[1.02] bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                <Calendar size={14} className="text-purple-600" /> Réalisées ce mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-800">{kpis.thisMonthCount}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Mois en cours</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-emerald-600 transition hover:scale-[1.02] bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" /> Sous Garantie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-800">{kpis.underWarranty}</div>
              <p className="text-[10px] text-slate-400 mt-1">Appareils protégés</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-amber-600 transition hover:scale-[1.02] bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                <CheckCircle size={14} className="text-amber-600" /> Factures déposées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-800">{kpis.depositedInvoices}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Traitement de paiement actif</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-sky-600 transition hover:scale-[1.02] bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                <Clock size={14} className="text-sky-600" /> Durée Moyenne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-800">{kpis.avgDurationStr}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Temps moyen sur site</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Rechercher par objet, RIT, site, équipement..." 
            className="pl-10 rounded-xl" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b">
                  <tr>
                    <th className="px-6 py-4">RIT & Date</th>
                    <th className="px-6 py-4">Équipement & Lieu</th>
                    <th className="px-6 py-4">Technicien Responsable</th>
                    <th className="px-6 py-4">Objet & Statut Tech</th>
                    <th className="px-6 py-4">Statut Admin</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr><td colSpan={6} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600" /></td></tr>
                  ) : filteredInterventions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-20 text-muted-foreground italic">Aucune intervention enregistrée.</td></tr>
                  ) : filteredInterventions.map(item => {
                    const duration = getDurationString(item.start_date, item.end_date);
                    const techName = item.profiles ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim() : null;
                    const techStatus = getTechnicalStatus(item);

                    return (
                      <tr key={item.id} className="hover:bg-accent/50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-black text-blue-600 flex items-center gap-1">
                              <FileSpreadsheet size={12} /> {item.rit_number || "RIT --"}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-1 flex items-center">
                              <Calendar size={12} className="mr-1 text-muted-foreground" />
                              {format(new Date(item.intervention_date), 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">
                            {item.assets?.name}
                            {item.assets?.brand && (
                              <span className="text-xs font-medium text-slate-500 ml-1.5 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.assets.brand}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={cn(
                              "text-[9px] uppercase border-none",
                              item.intervention_place === "Sur Site" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                            )}>
                              {item.intervention_place === "Sur Site" ? <MapPin size={8} className="mr-1" /> : <Warehouse size={8} className="mr-1" />}
                              {item.intervention_place}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">• {item.assets?.location}</span>
                          </div>
                        </td>
                        
                        {/* TECHNICIEN RESPONSABLE */}
                        <td className="px-6 py-4">
                          {techName ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold">
                                {techName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-xs font-bold text-slate-700">{techName}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Non assigné</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm font-medium line-clamp-1">{item.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={cn("rounded-full text-[9px] font-black uppercase tracking-wider border px-2.5", techStatus.style)}>
                              {techStatus.label}
                            </Badge>
                            {duration && (
                              <Badge variant="secondary" className="rounded-full text-[9px] bg-slate-100 text-slate-800 font-bold flex items-center">
                                <Clock size={10} className="mr-1 text-slate-600" /> {duration}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(item.invoice_status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {isSec && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-full text-[10px] font-bold border-blue-200 text-blue-600 hover:bg-blue-50"
                                  >
                                    Changer Statut <ChevronDown size={12} className="ml-1" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                  <DropdownMenuItem onClick={() => handleUpdateInvoiceStatus(item.id, 'Facture déposée')} className="text-green-600 font-bold cursor-pointer">
                                    <CheckCircle2 size={14} className="mr-2" /> Facture déposée
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateInvoiceStatus(item.id, 'Sous garantie')} className="text-blue-600 font-bold cursor-pointer">
                                    <ShieldCheck size={14} className="mr-2" /> Sous garantie
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateInvoiceStatus(item.id, 'Sous contrat')} className="text-purple-600 font-bold cursor-pointer">
                                    <ShieldAlert size={14} className="mr-2" /> Sous contrat
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateInvoiceStatus(item.id, 'Facture non déposée')} className="text-red-600 font-bold cursor-pointer">
                                    <XCircle size={14} className="mr-2" /> Non déposée
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-full"
                                  onClick={() => { setSelectedIntervention(item); setIsDetailOpen(true); }}
                                >
                                  <Eye size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Détails complets</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-500 hover:bg-slate-50 rounded-full"
                                  onClick={() => { setSelectedIntervention(item); setIsReportOpen(true); }}
                                >
                                  <FileText size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Créer rapport</TooltipContent>
                            </Tooltip>
                            
                            {canEdit && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-amber-600 hover:bg-amber-50 rounded-full"
                                      onClick={() => { setSelectedIntervention(item); setIsEditOpen(true); }}
                                    >
                                      <Edit2 size={16} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Modifier</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"
                                      onClick={() => { setSelectedIntervention(item); setIsDeleteOpen(true); }}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Supprimer</TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog Détails complets de l'intervention */}
        <InterventionDetailDialog 
          intervention={selectedIntervention} 
          isOpen={isDetailOpen} 
          onClose={() => setIsDetailOpen(false)} 
        />

        {/* Dialog Modification */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-lg rounded-xl">
            <DialogHeader>
              <DialogTitle>Modifier l'intervention</DialogTitle>
              <DialogDescription>Mettez à jour les informations de l'intervention sélectionnée.</DialogDescription>
            </DialogHeader>
            {selectedIntervention && (
              <AddPastInterventionForm 
                initialData={selectedIntervention} 
                onSuccess={() => { setIsEditOpen(false); fetchInterventions(); }} 
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Générer Rapport */}
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogContent className="sm:max-w-lg rounded-xl">
            <DialogHeader>
              <DialogTitle>Générer un Rapport Administratif</DialogTitle>
              <DialogDescription>Créez un document officiel basé sur cette intervention.</DialogDescription>
            </DialogHeader>
            {selectedIntervention && (
              <CreateReportForm 
                initialData={{
                  ...selectedIntervention,
                  due_date: selectedIntervention.intervention_date
                }} 
                onSuccess={() => { setIsReportOpen(false); }} 
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Alerte Suppression */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer l'intervention ?</AlertDialogTitle>
              <AlertDialogDescription>Cela retirera cette action de l'historique et de la fiche de vie de l'équipement.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600">Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default InterventionsPage;