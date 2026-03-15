import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FilePlus, Search, Filter, Loader2, Edit2, Trash2, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import WorkOrderForm from "@/components/WorkOrderForm";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { PRIORITES, STATUTS_WORK_ORDER } from "@/utils/constants";

const WorkOrdersPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOT, setSelectedOT] = useState<any>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("Toutes");
  const [filterTechnician, setFilterTechnician] = useState<string>("Tous");

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch Work Orders
    const { data: woData, error: woError } = await supabase
      .from('work_orders')
      .select('*, assets(name, serial_number, location), profiles:assigned_to(first_name, last_name)')
      .order('created_at', { ascending: false });

    // Fetch Technicians for filter
    const { data: techData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .order('last_name');

    if (woError) {
      showError("Erreur de chargement.");
    } else {
      setWorkOrders(woData || []);
      setTechnicians(techData?.map(t => ({ id: t.id, name: `${t.first_name} ${t.last_name}` })) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredOTs = useMemo(() => {
    return workOrders.filter(ot => {
      const matchesSearch = 
        ot.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        ot.assets?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ot.assets?.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ot.assets?.location?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = filterPriority === "Toutes" || ot.priority === filterPriority;
      
      let matchesTech = true;
      if (filterTechnician === "Unassigned") {
        matchesTech = !ot.assigned_to;
      } else if (filterTechnician !== "Tous") {
        matchesTech = ot.assigned_to === filterTechnician;
      }
      
      return matchesSearch && matchesPriority && matchesTech;
    });
  }, [workOrders, searchTerm, filterPriority, filterTechnician]);

  const handleDelete = async () => {
    if (!selectedOT) return;
    const { error } = await supabase.from('work_orders').delete().eq('id', selectedOT.id);
    if (error) showError("Erreur lors de la suppression.");
    else {
      showSuccess("Ordre de travail supprimé.");
      fetchData();
    }
    setIsDeleteOpen(false);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Critique': return 'bg-red-900 text-white';
      case 'Élevée': return 'bg-red-500 text-white';
      case 'Moyenne': return 'bg-amber-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Ordres de Travail</h1>
          <p className="text-lg text-muted-foreground">Suivi des demandes de maintenance biomédicale.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg h-12 px-6 font-bold">
              <FilePlus className="mr-2 h-5 w-5" /> Créer un OT
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader><DialogTitle className="text-2xl font-black">Nouvel Ordre de Travail</DialogTitle></DialogHeader>
            <WorkOrderForm onSuccess={() => { setIsCreateOpen(false); fetchData(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-4 rounded-2xl shadow-sm border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Rechercher par objet, équipement, SN ou site..." 
            className="pl-10 rounded-xl border-none bg-slate-50 h-11" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <select 
            className="rounded-xl border-none bg-slate-50 h-11 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 min-w-[140px]"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="Toutes">Toutes Priorités</option>
            {PRIORITES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select 
            className="rounded-xl border-none bg-slate-50 h-11 px-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 min-w-[160px]"
            value={filterTechnician}
            onChange={(e) => setFilterTechnician(e.target.value)}
          >
            <option value="Tous">Tous les Techniciens</option>
            <option value="Unassigned">Non assignés</option>
            {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <Button variant="outline" className="rounded-xl h-11 border-slate-200" onClick={fetchData}>
            <Filter size={18} />
          </Button>
        </div>
      </div>
      
      <Card className="shadow-xl border-none overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">Priorité</th>
                  <th className="px-6 py-4">Objet / Équipement</th>
                  <th className="px-6 py-4">Technicien</th>
                  <th className="px-6 py-4">Échéance</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600 h-10 w-10" /></td></tr>
                ) : filteredOTs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-20 text-muted-foreground italic">Aucun ordre de travail trouvé.</td></tr>
                ) : filteredOTs.map((ot) => (
                  <tr key={ot.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Badge className={cn("rounded-full text-[9px] font-black uppercase px-3", getPriorityColor(ot.priority))}>
                        {ot.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{ot.title}</div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-blue-600 font-black uppercase">{ot.assets?.name || 'Inconnu'}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-medium">
                          SN: {ot.assets?.serial_number || 'N/A'} • {ot.assets?.location || 'Sans site'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ot.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                            {ot.profiles?.first_name?.[0]}{ot.profiles?.last_name?.[0]}
                          </div>
                          <span className="text-xs font-medium text-slate-700">
                            {ot.profiles?.first_name} {ot.profiles?.last_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-xs font-bold">
                        <Clock size={12} className="mr-1 text-slate-400" />
                        {ot.due_date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="rounded-full text-[9px] font-black uppercase border-slate-200">
                        {ot.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-full"
                          onClick={() => { setSelectedOT(ot); setIsEditOpen(true); }}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"
                          onClick={() => { setSelectedOT(ot); setIsDeleteOpen(true); }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modale de Modification */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">Modifier l'OT</DialogTitle></DialogHeader>
          {selectedOT && <WorkOrderForm initialData={selectedOT} onSuccess={() => { setIsEditOpen(false); fetchData(); }} />}
        </DialogContent>
      </Dialog>

      {/* Alerte de Suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Supprimer cet ordre de travail ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. L'OT sera définitivement retiré de la base.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkOrdersPage;