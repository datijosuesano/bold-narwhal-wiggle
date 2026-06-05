"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Loader2, 
  ShieldAlert, 
  Briefcase, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  Filter 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import TechniciansTable, { Technician } from '@/components/TechniciansTable';
import CreateTechnicianForm from '@/components/CreateTechnicianForm';
import EditTechnicianForm from '@/components/EditTechnicianForm';
import TechnicianTasksDialog from '@/components/TechnicianTasksDialog';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ITEMS_PER_PAGE = 8;

const mapStatus = (status: string | null): 'Available' | 'InIntervention' | 'OnLeave' => {
  if (!status) return 'Available';
  const normalized = status.toLowerCase().trim();
  if (normalized === 'disponible' || normalized === 'available') return 'Available';
  if (normalized === 'en intervention' || normalized === 'inintervention') return 'InIntervention';
  if (normalized === 'en congé' || normalized === 'en conge' || normalized === 'onleave') return 'OnLeave';
  return 'Available';
};

const isLoggedToday = (lastLoginStr: string | null | undefined): boolean => {
  if (!lastLoginStr) return false;
  const loginDate = new Date(lastLoginStr);
  const today = new Date();
  return (
    loginDate.getDate() === today.getDate() &&
    loginDate.getMonth() === today.getMonth() &&
    loginDate.getFullYear() === today.getFullYear()
  );
};

const TechniciansPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole(['admin']);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTechnicians = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, telephone, specialite, status, role, last_login')
        .order('last_login', { ascending: false });

      if (error) throw error;

      const mapped: Technician[] = (data || []).map(p => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
        return {
          id: p.id,
          name: fullName || p.email || 'Utilisateur sans nom',
          specialty: p.specialite || (p.role === 'user' ? 'Nouveau compte' : 'Non défini'),
          status: mapStatus(p.status),
          activeOrders: 0,
          phone: p.telephone || 'N/A',
          email: p.email || 'N/A',
          last_login: p.last_login,
          role: p.role || 'user'
        };
      });
      setTechnicians(mapped);
    } catch (err: any) {
      console.error("Error fetching technicians:", err);
      showError("Erreur lors du chargement des profils : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const total = technicians.length;
    const bioTechs = technicians.filter(t => t.role === 'technicien_biomedical').length;
    const stockManagers = technicians.filter(t => t.role === 'gestionnaire_stock').length;
    const admins = technicians.filter(t => t.role === 'admin').length;
    const loggedToday = technicians.filter(t => isLoggedToday(t.last_login)).length;

    return { total, bioTechs, stockManagers, admins, loggedToday };
  }, [technicians]);

  // Filtering
  const filteredTechnicians = useMemo(() => {
    return technicians.filter(tech => {
      const matchesSearch = 
        tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.specialty.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "all" || tech.role === roleFilter;
      const matchesStatus = statusFilter === "all" || tech.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [technicians, searchTerm, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTechnicians.length / ITEMS_PER_PAGE);
  const paginatedTechnicians = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTechnicians.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTechnicians, currentPage]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const handleEdit = (tech: Technician) => {
    if (!isAdmin) return;
    setSelectedTech(tech);
    setIsEditOpen(true);
  };

  const handleShowTasks = (tech: Technician) => {
    setSelectedTech(tech);
    setIsTasksOpen(true);
  };

  const handleDeleteClick = (tech: Technician) => {
    if (!isAdmin) return;

    // Safety checks
    if (tech.id === user?.id) {
      showError("Sécurité : Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    if (tech.role === 'admin') {
      showError("Sécurité : La suppression d'un administrateur est interdite.");
      return;
    }

    setSelectedTech(tech);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTech || !user) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId: selectedTech.id }
      });

      if (error) throw error;
      
      showSuccess(`Le compte de ${selectedTech.name} a été supprimé.`);
      
      // Avoid full reload: update local state directly
      setTechnicians(prev => prev.filter(t => t.id !== selectedTech.id));
    } catch (err: any) {
      console.error("Delete error:", err);
      showError(`Erreur lors de la suppression : ${err.message}`);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setSelectedTech(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Utilisateurs & Équipe</h1>
            <p className="text-lg text-muted-foreground">Consultez et gérez les membres de l'équipe technique biomédicale.</p>
          </div>
        </div>
        
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md h-11 font-bold">
                <UserPlus className="mr-2 h-4 w-4" /> Nouvel Utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Ajouter un Intervenant</DialogTitle>
                <DialogDescription>Procédure d'invitation de nouveaux membres.</DialogDescription>
              </DialogHeader>
              <CreateTechnicianForm onSuccess={() => { setIsCreateOpen(false); fetchTechnicians(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm border-l-4 border-l-blue-600 bg-white">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <Users size={12} className="text-blue-600" /> Total Équipe
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-black text-slate-800">{kpis.total}</div>}
            <p className="text-[9px] text-muted-foreground">Comptes enregistrés</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-green-500 bg-white">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <Briefcase size={12} className="text-green-500" /> Techniciens
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-black text-slate-800">{kpis.bioTechs}</div>}
            <p className="text-[9px] text-muted-foreground">Biomédicaux actifs</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-purple-500 bg-white">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <Users size={12} className="text-purple-500" /> Gestionnaires
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-black text-slate-800">{kpis.stockManagers}</div>}
            <p className="text-[9px] text-muted-foreground">Gestion de stock</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-indigo-500 bg-white">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-indigo-500" /> Admins
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-black text-slate-800">{kpis.admins}</div>}
            <p className="text-[9px] text-muted-foreground">Administrateurs système</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-amber-500 bg-white col-span-2 lg:col-span-1">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <Clock size={12} className="text-amber-500" /> Actifs Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-black text-slate-800">{kpis.loggedToday}</div>}
            <p className="text-[9px] text-muted-foreground">Utilisateurs connectés</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            placeholder="Rechercher par nom, email, spécialité..." 
            className="pl-10 rounded-xl h-11 border-slate-200" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="rounded-xl h-11 border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <Filter size={14} />
                <SelectValue placeholder="Tous les rôles" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="admin">Administrateur</SelectItem>
              <SelectItem value="technicien_biomedical">Technicien Biomédical</SelectItem>
              <SelectItem value="gestionnaire_stock">Gestionnaire de Stock</SelectItem>
              <SelectItem value="secretaire">Secrétaire</SelectItem>
              <SelectItem value="user">Collaborateur</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="rounded-xl h-11 border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <UserCheck size={14} />
                <SelectValue placeholder="Tous les statuts" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Available">Disponible</SelectItem>
              <SelectItem value="InIntervention">En Intervention</SelectItem>
              <SelectItem value="OnLeave">En Congé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABLE CARD */}
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Liste des comptes</CardTitle>
              <CardDescription>
                {isAdmin ? "Cliquez sur Modifier pour finaliser un profil ou attribuer des droits." : "Liste des collaborateurs en lecture seule."}
              </CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full font-bold">
              {filteredTechnicians.length} résultat(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center space-y-4">
              <Loader2 className="animate-spin h-10 w-10 mx-auto text-blue-600" />
              <p className="text-muted-foreground text-sm">Chargement des profils de l'équipe...</p>
            </div>
          ) : (
            <>
              <TechniciansTable 
                technicians={paginatedTechnicians} 
                onEdit={handleEdit}
                onShowTasks={handleShowTasks}
                onDelete={handleDeleteClick}
                canManage={isAdmin}
              />

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 py-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl h-9 font-bold"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <span className="text-xs font-black text-slate-500 uppercase">Page {currentPage} / {totalPages}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl h-9 font-bold"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* EDIT DIALOG */}
      {isAdmin && (
        <>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[500px] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Gérer l'utilisateur</DialogTitle>
                <DialogDescription>Assignez une spécialité et définissez le niveau d'accès.</DialogDescription>
              </DialogHeader>
              {selectedTech && (
                <EditTechnicianForm 
                  technician={selectedTech} 
                  onSuccess={() => { 
                    setIsEditOpen(false); 
                    fetchTechnicians(); 
                  }} 
                />
              )}
            </DialogContent>
          </Dialog>

          {/* DELETE CONFIRMATION */}
          <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent className="rounded-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                  <ShieldAlert size={20} /> Supprimer le compte ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action retirera définitivement l'accès à cet utilisateur et supprimera son compte d'authentification.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 rounded-xl" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* TASKS DIALOG */}
      <TechnicianTasksDialog 
        technician={selectedTech} 
        isOpen={isTasksOpen} 
        onClose={() => setIsTasksOpen(false)} 
      />
    </div>
  );
};

export default TechniciansPage;