"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useReactToPrint } from "react-to-print";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Plus, Search, CheckCircle2, Loader2, Calendar, MapPin, Edit2, Trash2, FileText, ChevronDown, XCircle, ShieldCheck, ShieldAlert, Warehouse, Eye, FileSpreadsheet, Clock, FileCheck2, Printer, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
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
  description: string;
  asset_id: string;
  invoice_status: string;
  invoice_number: string;
  intervention_place: string;
  accessories_received?: string | null;
  client_signature_url?: string | null;
  assets: {
    name: string;
    location: string;
    brand?: string | null;
  } | null;
}

const InterventionsPage: React.FC = () => {
  const { hasRole, role } = useAuth();
  const canEdit = hasRole(['admin', 'technicien biomedical']);
  const isSec = role === 'secretaire' || role === 'admin';

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchInterventions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('interventions')
        .select('*, assets(name, location, brand)')
        .order('intervention_date', { ascending: false });

      if (error) {
        console.error("Erreur de requête Supabase:", error);
        showError(`Erreur de chargement: ${error.message}`);
        throw error;
      }
      
      setInterventions(data || []);
    } catch (err) {
      console.error("Erreur attrapée dans fetchInterventions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInterventions(); }, []);

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
    
    try {
      const { error } = await supabase
        .from('interventions')
        .delete()
        .eq('id', selectedIntervention.id);

      if (error) {
        // Affiche la raison exacte du blocage (Ex: Contrainte PostgreSQL)
        console.error("Détails erreur suppression:", error);
        showError(`Impossible de supprimer : ${error.message}`);
      } else {
        showSuccess("Intervention supprimée avec succès.");
        fetchInterventions();
      }
    } catch (catchErr: any) {
      showError(`Erreur système : ${catchErr.message}`);
    } finally {
      setIsDeleteOpen(false);
    }
  }; };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Facture déposée': return <Badge className="bg-green-100 text-green-700 border-green-200 rounded-full"><CheckCircle2 size={10} className="mr-1" /> Déposée</Badge>;
      case 'Sous garantie': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full"><ShieldCheck size={10} className="mr-1" /> Garantie</Badge>;
      case 'Sous contrat': return <Badge className="bg-purple-100 text-purple-700 border-purple-200 rounded-full"><ShieldAlert size={10} className="mr-1" /> Contrat</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-full"><XCircle size={10} className="mr-1" /> Non déposée</Badge>;
    }
  };

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

  // --- SÉCURISATION MAXIMALE DU FILTRE CONTRE LES VALEURS NULL ---
  const filteredInterventions = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase().trim();
    
    return interventions.filter(item => {
      // On convertit chaque champ en chaîne, même s'il est vide (null ou undefined)
      const title = (item.title || "").toLowerCase();
      const ritNumber = (item.rit_number || "").toLowerCase();
      const assetName = (item.assets?.name || "").toLowerCase();
      const assetLocation = (item.assets?.location || "").toLowerCase();

      const matchesSearch = 
        title.includes(lowerCaseSearch) ||
        ritNumber.includes(lowerCaseSearch) ||
        assetName.includes(lowerCaseSearch) ||
        assetLocation.includes(lowerCaseSearch);

      const matchesStatus = 
        selectedStatus === 'all' || 
        item.invoice_status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [interventions, searchTerm, selectedStatus]);

  const handleConfirmPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Registre_Interventions_${format(new Date(), "yyyy-MM-dd")}`,
    onAfterPrint: () => setIsPreviewOpen(false),
    pageStyle: `
      @page { size: landscape; margin: 15mm; }
      body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    `,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-2xl"><Wrench className="h-8 w-8 text-green-600" /></div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Interventions</h1>
            <p className="text-lg text-muted-foreground">Journal historique et suivi administratif.</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => setIsPreviewOpen(true)} variant="outline" className="rounded-xl border-slate-200 font-bold h-11 hover:bg-slate-50 flex-1 md:flex-none">
            <FileCheck2 size={16} className="mr-1.5 text-blue-600" /> Aperçu & Exporter
          </Button>

          {canEdit && (
            <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 rounded-xl shadow-md h-11 flex-1 md:flex-none">
                  <Plus className="mr-2 h-4 w-4" /> Enregistrer Intervention
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nouvelle Intervention</DialogTitle>
                  <DialogDescription>Saisissez les détails de l'action technique réalisée.</DialogDescription>
                </DialogHeader>
                <AddPastInterventionForm onSuccess={() => { setIsLogOpen(false); fetchInterventions(); }} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card className="shadow-lg border-none rounded-2xl">
        <CardContent className="p-0">
          {/* FILTERS */}
          <div className="p-4 border-b flex flex-col md:flex-row gap-4 bg-slate-50/50 rounded-t-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Rechercher par objet, RIT, site, équipement..." 
                className="pl-10 rounded-xl bg-white border-slate-200" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="rounded-xl bg-white border-slate-200">
                  <div className="flex items-center"><Filter className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Tous les statuts" /></div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Facture déposée">Facture déposée</SelectItem>
                  <SelectItem value="Facture non déposée">Non déposée</SelectItem>
                  <SelectItem value="Sous garantie">Sous garantie</SelectItem>
                  <SelectItem value="Sous contrat">Sous contrat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TABLE DATA */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase font-black text-slate-500 bg-slate-50 border-b tracking-wider">
                <tr>
                  <th className="px-6 py-4">RIT & Date</th>
                  <th className="px-6 py-4">Équipement & Lieu</th>
                  <th className="px-6 py-4">Objet / Durée</th>
                  <th className="px-6 py-4">Statut Admin</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-20"><Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600 mb-2" /></td></tr>
                ) : filteredInterventions.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16 text-muted-foreground italic">Aucune intervention enregistrée.</td></tr>
                ) : filteredInterventions.map(item => {
                  const duration = getDurationString(item.start_date, item.end_date);
                  // Sécurisation de l'affichage des dates
                  let formattedDate = "---";
                  try {
                    if (item.intervention_date) {
                      formattedDate = format(new Date(item.intervention_date), 'dd/MM/yyyy');
                    }
                  } catch (e) {
                    console.error("Erreur de formatage de date pour l'item:", item.id);
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-black text-blue-600 flex items-center gap-1">
                            <FileSpreadsheet size={12} /> {item.rit_number || "RIT --"}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-1 flex items-center">
                            <Calendar size={12} className="mr-1 text-muted-foreground" />
                            {formattedDate}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {item.assets?.name || "Équipement inconnu"}
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
                            {item.intervention_place || "Non spécifié"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">• {item.assets?.location || "Pas de lieu"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium line-clamp-1">{item.title || "Sans objet"}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="rounded-full text-[9px] uppercase">{item.maintenance_type || "Standard"}</Badge>
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
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isSec && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50" title="Changer Statut">
                                  <ChevronDown size={14} />
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
                          
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedIntervention(item); setIsDetailOpen(true); }} title="Voir Détails">
                            <Eye size={14} />
                          </Button>

                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-50" onClick={() => { setSelectedIntervention(item); setIsReportOpen(true); }} title="Générer Rapport">
                            <FileText size={14} />
                          </Button>
                          
                          {canEdit && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-amber-600 hover:bg-amber-50" onClick={() => { setSelectedIntervention(item); setIsEditOpen(true); }} title="Modifier">
                                <Edit2 size={14} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50" onClick={() => { setSelectedIntervention(item); setIsDeleteOpen(true); }} title="Supprimer">
                                <Trash2 size={14} />
                              </Button>
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

      {/* MODALE D'APERÇU WYSIWYG & EXPORT PDF */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col rounded-2xl p-0 overflow-hidden bg-slate-50">
          <DialogHeader className="p-6 bg-white border-b shrink-0 shadow-sm z-10">
            <DialogTitle className="flex items-center text-xl font-black text-slate-800">
              <Eye className="w-5 h-5 mr-2 text-blue-600" /> Aperçu du Journal des Interventions
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 bg-slate-200 flex justify-center custom-scrollbar">
            <div ref={printRef} className="bg-white p-10 shadow-lg border w-full max-w-[1100px] min-h-[700px]">
              
              <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-8">
                <div>
                  <h1 className="text-2xl font-black uppercase text-black tracking-tight">Journal des Interventions Techniques</h1>
                  <p className="text-sm font-bold text-gray-700 mt-1">
                    Filtre Statut : <span className="text-blue-600">{selectedStatus === 'all' ? 'Tous les statuts' : selectedStatus}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-blue-600 uppercase">BioPulse GMAO</p>
                  <p className="text-xs font-mono mt-1 text-gray-500">Édité le {format(new Date(), 'dd/MM/yyyy à HH:mm')}</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 border-b-2 border-black">
                  <tr>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">N° RIT / Date</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Équipement / Lieu</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Objet / Type</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Statut Facturation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {filteredInterventions.map((item) => {
                    let pDate = "---";
                    try { if (item.intervention_date) pDate = format(new Date(item.intervention_date), 'dd/MM/yyyy'); } catch(e){}
                    
                    return (
                      <tr key={item.id}>
                        <td className="py-3 px-3 border border-gray-300">
                          <div className="font-mono text-xs font-bold text-black">{item.rit_number || "RIT --"}</div>
                          <div className="text-[10px] text-gray-600 mt-1">{pDate}</div>
                        </td>
                        <td className="py-3 px-3 border border-gray-300">
                          <div className="font-bold text-black text-xs">{item.assets?.name || '---'}</div>
                          <div className="text-[10px] text-gray-700 mt-1">{item.assets?.location || '---'} ({item.intervention_place || '---'})</div>
                        </td>
                        <td className="py-3 px-3 border border-gray-300">
                          <div className="text-xs text-black font-medium">{item.title || '---'}</div>
                          <div className="text-[10px] text-gray-600 uppercase mt-1">{item.maintenance_type || '---'}</div>
                        </td>
                        <td className="py-3 px-3 border border-gray-300 text-xs font-bold text-gray-800 uppercase">
                          {item.invoice_status || '---'}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInterventions.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-500 italic">Aucune intervention disponible.</td></tr>
                  )}
                </tbody>
              </table>

              <div className="mt-12 pt-4 border-t border-gray-300 flex justify-between text-xs text-gray-500">
                <p>Total : {filteredInterventions.length} intervention(s) répertoriée(s).</p>
                <p>Document officiel BioPulse GMAO.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-white border-t shrink-0 flex items-center justify-between">
            <p className="text-xs text-slate-500 italic hidden sm:block">
              * Astuce : Choisissez "Enregistrer au format PDF" dans la fenêtre d'impression. Format Paysage recommandé.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setIsPreviewOpen(false)}>Annuler</Button>
              <Button onClick={() => handleConfirmPrint()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold"><Printer className="w-4 h-4 mr-2" /> Imprimer le Journal</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AUTRES MODALES ATTACHÉES */}
      <InterventionDetailDialog intervention={selectedIntervention} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'intervention</DialogTitle>
            <DialogDescription>Mettez à jour les informations de l'intervention sélectionnée.</DialogDescription>
          </DialogHeader>
          {selectedIntervention && (
            <AddPastInterventionForm initialData={selectedIntervention} onSuccess={() => { setIsEditOpen(false); fetchInterventions(); }} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle>Générer un Rapport Administratif</DialogTitle>
            <DialogDescription>Créez un document officiel basé sur cette intervention.</DialogDescription>
          </DialogHeader>
          {selectedIntervention && (
            <CreateReportForm initialData={{ ...selectedIntervention, due_date: selectedIntervention.intervention_date }} onSuccess={() => { setIsReportOpen(false); }} />
          )}
        </DialogContent>
      </Dialog>

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
  );
};

export default InterventionsPage;