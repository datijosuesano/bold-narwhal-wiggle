"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useReactToPrint } from "react-to-print";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Loader2,
  Filter,
  Printer,
  FileCheck2,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Si tu as ces composants, décommente-les (ou ajuste les chemins)
// import CreateInterventionForm from "@/components/CreateInterventionForm";
// import EditInterventionForm from "@/components/EditInterventionForm";
// import InterventionDetailView from "@/components/InterventionDetailView";

const InterventionsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'technician', 'technicien_biomedical']);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Ajuste le nom de ta table si c'est 'interventions' ou 'work_orders'
      const { data, error } = await supabase
        .from('work_orders') // <-- Remplace par 'interventions' si c'est le nom de ta table
        .select(`
          *,
          assets(name, serial_number, location),
          profiles!work_orders_technician_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInterventions(data || []);
    } catch (err: any) {
      console.error("Erreur chargement des interventions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Filtrage intelligent
  const filteredInterventions = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    return interventions.filter(item => {
      const reference = (item.reference || "").toLowerCase();
      const title = (item.title || item.description || "").toLowerCase();
      const assetName = (item.assets?.name || "").toLowerCase();
      
      const matchesSearch =
        reference.includes(lowerCaseSearch) ||
        title.includes(lowerCaseSearch) ||
        assetName.includes(lowerCaseSearch);

      const matchesStatus =
        selectedStatus === "all" ||
        item.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [interventions, searchTerm, selectedStatus]);

  // Statistiques rapides
  const stats = useMemo(() => {
    return {
      total: interventions.length,
      pending: interventions.filter(i => i.status === 'En attente' || i.status === 'Ouvert').length,
      inProgress: interventions.filter(i => i.status === 'En cours').length,
      completed: interventions.filter(i => i.status === 'Terminé' || i.status === 'Clôturé').length,
    };
  }, [interventions]);

  const handleConfirmPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Registre_Interventions_${format(new Date(), "yyyy-MM-dd")}`,
    onAfterPrint: () => setIsPreviewOpen(false),
    pageStyle: `
      @page { size: landscape; margin: 15mm; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    `,
  });

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes('attente') || s === 'ouvert') return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">En attente</Badge>;
    if (s.includes('cours')) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">En cours</Badge>;
    if (s.includes('termin') || s.includes('clôtur')) return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Terminé</Badge>;
    if (s.includes('annul')) return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-300 border-none">Annulé</Badge>;
    return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes('préventif')) return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Préventif</Badge>;
    if (t.includes('correctif') || t.includes('curatif')) return <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">Correctif</Badge>;
    return <Badge variant="outline">{type || 'Standard'}</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Wrench className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Registre des Interventions</h1>
            <p className="text-lg text-muted-foreground">Pilotez les ordres de travail et la maintenance.</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => setIsPreviewOpen(true)} variant="outline" className="rounded-xl border-slate-200 font-bold h-11 hover:bg-slate-50 flex-1 md:flex-none">
            <FileCheck2 size={16} className="mr-1.5 text-blue-600" /> Aperçu & Exporter
          </Button>

          {canEdit && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md h-11 flex-1 md:flex-none">
              <Plus className="mr-2 h-4 w-4" /> Créer OT
            </Button>
          )}
        </div>
      </div>

      {/* KPIS RAPIDES */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="shadow-sm border-none bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-600"><Wrench size={20} /></div>
            <div><p className="text-xs font-bold text-slate-500 uppercase">Total OTs</p><p className="text-2xl font-black text-slate-900">{stats.total}</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white border-b-4 border-b-amber-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><AlertCircle size={20} /></div>
            <div><p className="text-xs font-bold text-slate-500 uppercase">En attente</p><p className="text-2xl font-black text-amber-600">{stats.pending}</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white border-b-4 border-b-blue-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Clock size={20} /></div>
            <div><p className="text-xs font-bold text-slate-500 uppercase">En cours</p><p className="text-2xl font-black text-blue-600">{stats.inProgress}</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white border-b-4 border-b-emerald-500">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><CheckCircle2 size={20} /></div>
            <div><p className="text-xs font-bold text-slate-500 uppercase">Terminés</p><p className="text-2xl font-black text-emerald-600">{stats.completed}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* TABLEAU */}
      <Card className="shadow-lg border-none rounded-2xl">
        <CardContent className="p-0">
          
          {/* FILTRES */}
          <div className="p-4 border-b flex flex-col md:flex-row gap-4 bg-slate-50/50 rounded-t-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher par référence, équipement..."
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
                  <SelectItem value="En attente">En attente</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Terminé">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[10px] uppercase font-black text-slate-500 bg-slate-50 border-b tracking-wider">
                <tr>
                  <th className="px-6 py-4">Réf & Équipement</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Intervenant & Date</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" /></td></tr>
                ) : filteredInterventions.length > 0 ? (
                  filteredInterventions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-mono text-blue-600 font-bold mb-0.5">
                          {item.reference || `OT-${item.id.substring(0,6).toUpperCase()}`}
                        </div>
                        <div className="font-bold text-slate-900 text-sm">{item.assets?.name || 'Équipement inconnu'}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[250px]">{item.title || item.description || '---'}</div>
                      </td>
                      <td className="px-6 py-4">{getTypeBadge(item.type)}</td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-800">
                          {item.profiles ? `${item.profiles.first_name} ${item.profiles.last_name}` : 'Non assigné'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center">
                          <Clock size={10} className="mr-1" />
                          {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy', { locale: fr }) : '---'}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedIntervention(item); setIsDetailModalOpen(true); }}>
                            <Eye size={14} />
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100" onClick={() => { setSelectedIntervention(item); setIsEditOpen(true); }}>
                              <Edit2 size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="text-center py-16 text-muted-foreground italic">Aucune intervention trouvée.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODALE EXPORT WYSIWYG */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col rounded-2xl p-0 overflow-hidden bg-slate-50">
          <DialogHeader className="p-6 bg-white border-b shrink-0 shadow-sm z-10">
            <DialogTitle className="flex items-center text-xl font-black text-slate-800">
              <Eye className="w-5 h-5 mr-2 text-blue-600" /> Aperçu du Registre
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 bg-slate-200 flex justify-center custom-scrollbar">
            <div ref={printRef} className="bg-white p-10 shadow-lg border w-full max-w-[1100px] min-h-[700px]">
              
              <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-8">
                <div>
                  <h1 className="text-2xl font-black uppercase text-black tracking-tight">Registre des Interventions Techniques</h1>
                  <p className="text-sm font-bold text-gray-700 mt-1">
                    Statut filtré : <span className="text-blue-600">{selectedStatus === 'all' ? 'Tous' : selectedStatus}</span>
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
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Réf. OT</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Équipement</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Type</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Technicien</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Date</th>
                    <th className="py-3 px-3 border border-gray-300 text-xs font-bold uppercase text-black">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {filteredInterventions.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-3 border border-gray-300 text-xs font-mono font-bold text-black">
                        {item.reference || `OT-${item.id.substring(0,6).toUpperCase()}`}
                      </td>
                      <td className="py-2 px-3 border border-gray-300">
                        <div className="font-bold text-black text-xs">{item.assets?.name || '---'}</div>
                      </td>
                      <td className="py-2 px-3 border border-gray-300 text-xs text-black">
                        {item.type || 'Standard'}
                      </td>
                      <td className="py-2 px-3 border border-gray-300 text-xs text-black">
                        {item.profiles ? `${item.profiles.first_name} ${item.profiles.last_name}` : '---'}
                      </td>
                      <td className="py-2 px-3 border border-gray-300 text-xs text-black">
                        {item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '---'}
                      </td>
                      <td className="py-2 px-3 border border-gray-300 text-xs font-bold uppercase">
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-12 pt-4 border-t border-gray-300 flex justify-between text-xs text-gray-500">
                <p>Total : {filteredInterventions.length} enregistrement(s).</p>
                <p>Document officiel BioPulse GMAO.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-white border-t shrink-0 flex items-center justify-between">
            <p className="text-xs text-slate-500 italic hidden sm:block">Aperçu avant impression (Paysage recommandé)</p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setIsPreviewOpen(false)}>Annuler</Button>
              <Button onClick={() => handleConfirmPrint()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold"><Printer className="w-4 h-4 mr-2" /> Imprimer</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PLACES HOLDERS POUR LES MODALES D'ÉDITION/CRÉATION */}
      {/* <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent><CreateInterventionForm onSuccess={() => { setIsCreateModalOpen(false); fetchData(); }} /></DialogContent>
        </Dialog>
        
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent><EditInterventionForm intervention={selectedIntervention} onSuccess={() => { setIsEditOpen(false); fetchData(); }} /></DialogContent>
        </Dialog>

        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent><InterventionDetailView intervention={selectedIntervention} /></DialogContent>
        </Dialog>
      */}

    </div>
  );
};

export default InterventionsPage;