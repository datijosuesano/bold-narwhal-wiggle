"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Hammer, 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  CheckCircle, 
  UserCheck, 
  Briefcase, 
  Filter, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  UserX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import CreateToolForm from '@/components/CreateToolForm';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface Tool {
  id: string;
  name: string;
  serial_number: string | null;
  category: string;
  status: string;
  assigned_to: string | null;

  // NEW FIELDS (GMAO EXTENSION)
  purchase_date: string | null;
  supplier: string | null;
  location: string | null;
  calibration_due_date: string | null;
  maintenance_due_date: string | null;
  condition: "excellent" | "bon" | "moyen" | "critique" | "hors_service" | null;
  notes: string | null;
}

interface Tech {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

const ITEMS_PER_PAGE = 12;

const ToolsPage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTech, setSelectedTech] = useState<string>("all");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Mutation Loading States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<Tool | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [mutationLoading, setMutationLoading] = useState<Record<string, boolean>>({});

  // Optimize data loading - select only columns required
  const fetchToolsOnly = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tools')
        .select('id, name, serial_number, category, status, assigned_to')
        .order('name');

      if (error) throw error;
      setTools((data as Tool[]) || []);
    } catch (err: any) {
      console.error("Error fetching tools:", err);
      showError("Impossible de charger le catalogue d'outils.");
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Parallel execution for best load performance
      const [toolsRes, profilesRes] = await Promise.all([
        supabase.from('tools').select('id, name, serial_number, category, status, assigned_to').order('name'),
        supabase.from('profiles').select('id, first_name, last_name')
      ]);

      if (toolsRes.error) throw toolsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      setTools((toolsRes.data as Tool[]) || []);
      setTechs((profilesRes.data as Tech[]) || []);
    } catch (err: any) {
      console.error("Error loading tools data:", err);
      showError("Une erreur est survenue lors du chargement de la page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle assignation with local state updates (no full refetches)
  const handleAssign = useCallback(async (toolId: string, techId: string) => {
    const status = techId === "null" ? 'Disponible' : 'Attribué';
    const assignedValue = techId === "null" ? null : techId;

    setMutationLoading(prev => ({ ...prev, [toolId]: true }));
    try {
      const { error } = await supabase
        .from('tools')
        .update({ 
          assigned_to: assignedValue, 
          status: status 
        })
        .eq('id', toolId);

      if (error) throw error;

      // Optimistic local state update to preserve filter states & avoid layout jumps
      setTools(prevTools => 
        prevTools.map(t => t.id === toolId ? { ...t, assigned_to: assignedValue, status } : t)
      );

      showSuccess("Affectation mise à jour avec succès.");
    } catch (err: any) {
      console.error("Error assigning tool:", err);
      showError(`Erreur d'affectation : ${err.message}`);
    } finally {
      setMutationLoading(prev => ({ ...prev, [toolId]: false }));
    }
  }, []);

  // Handle deletion with confirmation & local state updates
  const handleDeleteRequest = useCallback((tool: Tool) => {
    setToolToDelete(tool);
    setIsDeleteAlertOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!toolToDelete) return;

    const toolId = toolToDelete.id;
    setMutationLoading(prev => ({ ...prev, [toolId]: true }));
    setIsDeleteAlertOpen(false);

    try {
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', toolId);

      if (error) throw error;

      // Filter deleted tool from local state
      setTools(prevTools => prevTools.filter(t => t.id !== toolId));
      showSuccess(`L'outil "${toolToDelete.name}" a été retiré de l'inventaire.`);
    } catch (err: any) {
      console.error("Error deleting tool:", err);
      showError("Impossible de supprimer cet outil.");
    } finally {
      setMutationLoading(prev => ({ ...prev, [toolId]: false }));
      setToolToDelete(null);
    }
  }, [toolToDelete]);

  // Compute stats/KPIs
  const kpiStats = useMemo(() => {
    const total = tools.length;
    const available = tools.filter(t => t.status === 'Disponible').length;
    const assigned = tools.filter(t => t.assigned_to !== null).length;
    const uniqueCats = new Set(tools.map(t => t.category)).size;

    return { total, available, assigned, uniqueCats };
  }, [tools]);

  // Extract unique categories for filter
  const categoriesList = useMemo(() => {
    return Array.from(new Set(tools.map(t => t.category)));
  }, [tools]);

  // Quick lookup map for technician names
  const techMap = useMemo(() => {
    const map = new Map<string, string>();
    techs.forEach(t => {
      map.set(t.id, `${t.first_name || ''} ${t.last_name || ''}`.trim());
    });
    return map;
  }, [techs]);

  // Robust searching & filtering
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = 
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tool.serial_number || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
      const matchesStatus = selectedStatus === "all" || tool.status === selectedStatus;
      const matchesTech = selectedTech === "all" || (selectedTech === "none" ? !tool.assigned_to : tool.assigned_to === selectedTech);

      return matchesSearch && matchesCategory && matchesStatus && matchesTech;
    });
  }, [tools, searchTerm, selectedCategory, selectedStatus, selectedTech]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTools.length / ITEMS_PER_PAGE);
  const paginatedTools = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTools.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTools, currentPage]);

  // Reset pagination on filter adjustments
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus, selectedTech]);

  // Render Skeletons during loading
  const renderSkeletons = () => (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-28 rounded-2xl bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-64 rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Hammer className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Outils de Travail</h1>
            <p className="text-lg text-muted-foreground">Inventaire, affectation et suivi métrologique de l'outillage biomédical.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg h-11 font-bold">
              <Plus className="mr-2 h-4 w-4" /> Nouvel Outil
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Enregistrer un outil</DialogTitle>
              <DialogDescription>Ajoutez une référence d'outillage ou de mesure au parc technique.</DialogDescription>
            </DialogHeader>
            <CreateToolForm onSuccess={() => {
              setIsCreateOpen(false);
              fetchToolsOnly();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        renderSkeletons()
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border-l-4 border-l-blue-600 bg-white">
              <CardHeader className="pb-1 p-4">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                  <Hammer size={12} className="text-blue-600" /> Total Outillage
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-black text-slate-800">{kpiStats.total}</div>
                <p className="text-[9px] text-muted-foreground">Outils en inventaire</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-green-500 bg-white">
              <CardHeader className="pb-1 p-4">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 text-green-600">
                  <CheckCircle size={12} className="text-green-500" /> Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-black text-green-600">{kpiStats.available}</div>
                <p className="text-[9px] text-muted-foreground">Prêts à être affectés</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-purple-500 bg-white">
              <CardHeader className="pb-1 p-4">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 text-purple-600">
                  <UserCheck size={12} className="text-purple-500" /> Attribués
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-black text-purple-600">{kpiStats.assigned}</div>
                <p className="text-[9px] text-muted-foreground">Détenus par l'équipe</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-indigo-500 bg-white">
              <CardHeader className="pb-1 p-4">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 text-indigo-600">
                  <Briefcase size={12} className="text-indigo-500" /> Catégories
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-black text-indigo-700">{kpiStats.uniqueCats}</div>
                <p className="text-[9px] text-muted-foreground">Familles d'outils distinctes</p>
              </CardContent>
            </Card>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-2xl border shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input 
                placeholder="Rechercher par nom d'outil ou n° de série..." 
                className="pl-10 rounded-xl h-11 border-slate-200" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full lg:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Filter size={14} />
                    <SelectValue placeholder="Catégorie" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categoriesList.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full lg:w-48">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle size={14} />
                    <SelectValue placeholder="Statut" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Disponible">Disponible</SelectItem>
                  <SelectItem value="Attribué">Attribué</SelectItem>
                  <SelectItem value="En maintenance">En maintenance</SelectItem>
                  <SelectItem value="Réformé">Réformé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full lg:w-48">
              <Select value={selectedTech} onValueChange={setSelectedTech}>
                <SelectTrigger className="rounded-xl h-11 border-slate-200">
                  <div className="flex items-center gap-2 text-slate-600">
                    <UserCheck size={14} />
                    <SelectValue placeholder="Technicien" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tous les techniciens</SelectItem>
                  <SelectItem value="none">Non assignés</SelectItem>
                  {techs.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.first_name} {tech.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* GRID OF TOOLS */}
          {paginatedTools.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedTools.map(tool => {
                const assignedTechName = tool.assigned_to ? techMap.get(tool.assigned_to) : null;
                const isUpdating = !!mutationLoading[tool.id];

                return (
                  <Card key={tool.id} className="rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between bg-white border">
                    <CardHeader className="pb-3 border-b bg-slate-50/50">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-bold text-slate-900 leading-tight">
                            {tool.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] uppercase font-black px-1.5 h-4 bg-white">
                              {tool.category}
                            </Badge>
                            {tool.serial_number && (
                              <span className="font-mono text-[10px] text-slate-400">
                                S/N: {tool.serial_number}
                              </span>
                            )}
                          </div>
                        </div>

                        <Badge className={cn(
                          "rounded-full text-[9px] font-black uppercase px-2 h-5 shrink-0",
                          tool.status === 'Disponible' ? "bg-green-100 text-green-700 hover:bg-green-100 border border-green-200" : "bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-200"
                        )}>
                          {tool.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 flex items-center">
                            <UserCheck size={11} className="mr-1.5" /> Affectation Actuelle
                          </label>
                          <p className="text-xs font-bold text-slate-700">
                            {assignedTechName ? (
                              <span className="text-blue-600 flex items-center">
                                <ShieldCheck size={12} className="mr-1 shrink-0" />
                                {assignedTechName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic flex items-center">
                                <UserX size={12} className="mr-1 shrink-0" />
                                Aucun technicien affecté
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="space-y-1 pt-3 border-t">
                          <label className="text-[10px] font-black uppercase text-slate-400">Modifier l'affectation</label>
                          <Select 
                            defaultValue={tool.assigned_to || "null"} 
                            onValueChange={(val) => handleAssign(tool.id, val)}
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="rounded-xl h-10 text-xs bg-slate-50 border-none focus:ring-blue-500">
                              <SelectValue placeholder="Attribuer l'outil..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="null">-- Aucun (Disponible) --</SelectItem>
                              {techs.map(tech => (
                                <SelectItem key={tech.id} value={tech.id}>
                                  {tech.first_name} {tech.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-3 border-t">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 rounded-xl transition-all"
                          onClick={() => handleDeleteRequest(tool)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <Loader2 className="animate-spin h-4 w-4 text-red-500" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center border-2 border-dashed rounded-3xl bg-slate-50/50 max-w-md mx-auto space-y-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full w-14 h-14 flex items-center justify-center mx-auto shadow-inner">
                <Hammer size={28} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Aucun outil trouvé</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Aucun outillage technique ne correspond aux filtres de recherche sélectionnés. Réinitialisez vos filtres pour voir tout l'outillage biomédical.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                  setSelectedTech("all");
                }}
                className="rounded-xl font-bold text-xs"
              >
                Réinitialiser les filtres
              </Button>
            </Card>
          )}

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-6 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-slate-200 h-9 font-bold"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} className="mr-1" /> Précédent
              </Button>
              <span className="text-xs font-black text-slate-500 uppercase">Page {currentPage} sur {totalPages}</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-slate-200 h-9 font-bold"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Suivant <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-600" /> Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'outil technique <strong>{toolToDelete?.name}</strong> ? Cette action retirera définitivement cette référence du stock métrologique de BioPulse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ToolsPage;