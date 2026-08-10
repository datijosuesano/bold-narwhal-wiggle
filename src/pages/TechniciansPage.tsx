"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Loader2, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Filter,
  Shield,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TechniciansTable, { Technician } from '@/components/Technicians/TechniciansTable';
import CreateTechnicianForm from '@/components/Technicians/CreateTechnicianForm';
import EditTechnicianForm from '@/components/Technicians/EditTechnicianForm';
import TechnicianTasksDialog from '@/components/Technicians/TechnicianTasksDialog';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/useRoles';

const ITEMS_PER_PAGE = 10;

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
  const { roles, isLoading: isRolesLoading } = useRoles();

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

      const roleMap = new Map(roles.map(r => [r.name.toLowerCase(), r]));

      const mapped: Technician[] = (data || []).map((p: any) => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
        const roleKey = (p.role || 'user').toLowerCase();
        const matchedRole = roleMap.get(roleKey);

        return {
          id: p.id,
          name: fullName || p.email || 'Utilisateur sans nom',
          specialty: p.specialite || 'Non défini',
          status: mapStatus(p.status),
          activeOrders: 0,
          phone: p.telephone || 'N/A',
          email: p.email || 'N/A',
          last_login: p.last_login,
          role_name: p.role || 'user',
          role_label: matchedRole?.label || 'Collaborateur',
          role_color: matchedRole?.color || 'bg-slate-400'
        };
      });
      setTechnicians(mapped);
    } catch (err: any) {
      console.error("Error fetching technicians:", err);
      showError("Erreur lors du chargement des profils : " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [roles]);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  const kpis = useMemo(() => {
    const total = technicians.length;
    const loggedToday = technicians.filter(t => isLoggedToday(t.last_login)).length;
    
    const roleStats: Record<string, number> = {};
    roles.forEach(r => roleStats[r.name] = 0);
    
    technicians.forEach(t => {
      if (roleStats[t.role_name] !== undefined) {
        roleStats[t.role_name]++;
      }
    });

    return { total, loggedToday, roleStats };
  }, [technicians, roles]);

  const filteredTechnicians = useMemo(() => {
    return technicians.filter(tech => {
      const matchesSearch = 
        tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.specialty.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "all" || tech.role_name === roleFilter;
      const matchesStatus = statusFilter === "all" || tech.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [technicians, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredTechnicians.length / ITEMS_PER_PAGE);
  const paginatedTechnicians = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTechnicians.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTechnicians, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, statusFilter]);

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
    if (tech.id === user?.id) {
      showError("Sécurité : Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    setSelectedTech(tech);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTech) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId: selectedTech.id }
      });
      if (error) throw error;
      showSuccess(`Le compte de ${selectedTech.name} a été supprimé.`);
      setTechnicians(prev => prev.filter(t => t.id !== selectedTech.id));
    } catch (err: any) {
      showError(`Erreur : ${err.message}`);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setSelectedTech(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight uppercase">Équipe BioPulse</h1>
            <p className="text-lg text-muted-foreground">Gestion centralisée des accès et rôles dynamiques.</p>
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
                <DialogTitle className="text-2xl font-bold">Ajouter un Membre</DialogTitle>
                <DialogDescription>Chaque utilisateur doit s'inscrire individuellement via le portail.</DialogDescription>
              </DialogHeader>
              <CreateTechnicianForm onSuccess={() => { setIsCreateOpen(false); fetchTechnicians(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-blue-600 bg-white">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
              <Users size={12} className="text-blue-600" /> Effectif Total
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-slate-800">{isLoading ? "..." : kpis.total}</div>
            <p className="text-[9px] text-muted-foreground">Tous rôles confondus</p>
          </CardContent>
        </Card>

        {roles.slice(0, 2).map(role => (
          <Card key={role.id} className="shadow-sm border-l-4 bg-white" style={{ borderLeftColor: role.color.replace('bg-', '') }}>
            <CardHeader className="pb-1 p-4">
              <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                <Shield size={12} className="text-slate-400" /> {role.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-black text-slate-800">{isLoading ? "..." : (kpis.roleStats[role.name] || 0)}</div>
              <p className="text-[9px] text-muted-foreground">Membres affectés</p>
            </CardContent>
          </Card>
        ))}

        <Card className="shadow-sm border-l-4 border-l-amber-500 bg-white">
          <CardHeader className="pb-1 p-4">
            <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 text-amber-500">
              <Activity size={12} /> Connexions Jour
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-slate-800">{isLoading ? "..." : kpis.loggedToday}</div>
            <p className="text-[9px] text-muted-foreground">Actifs ce jour</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            placeholder="Rechercher par nom, email, métier..." 
            className="pl-10 rounded-xl h-11 border-slate-200" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-56">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="rounded-xl h-11 border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <Shield size={14} />
                <SelectValue placeholder="Filtrer par rôle" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tous les rôles</SelectItem>
              {roles.map(role => (
                <SelectItem key={role.id} value={role.name}>{role.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-56">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="rounded-xl h-11 border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <Filter size={14} />
                <SelectValue placeholder="Disponibilité" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Toutes disponibilités</SelectItem>
              <SelectItem value="Available">Disponible</SelectItem>
              <SelectItem value="InIntervention">En Intervention</SelectItem>
              <SelectItem value="OnLeave">En Congé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-xl border-none overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-20 text-center space-y-4 bg-white">
              <Loader2 className="animate-spin h-10 w-10 mx-auto text-blue-600" />
              <p className="text-muted-foreground font-medium">Chargement sécurisé de l'équipe...</p>
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

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 py-6 bg-slate-50/50 border-t">
                  <Button 
                    variant="outline" size="sm" className="rounded-xl h-10 font-bold"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >Précédent</Button>
                  <span className="text-xs font-black text-slate-500 uppercase">Page {currentPage} / {totalPages}</span>
                  <Button 
                    variant="outline" size="sm" className="rounded-xl h-10 font-bold"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >Suivant</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
              <DialogHeader>
                <DialogTitle>Édition du Profil</DialogTitle>
                <DialogDescription>Mise à jour des informations et attribution du rôle RBAC.</DialogDescription>
              </DialogHeader>
              {selectedTech && (
                <EditTechnicianForm 
                  technician={selectedTech} 
                  onSuccess={() => { setIsEditOpen(false); fetchTechnicians(); }} 
                />
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                  <ShieldAlert size={20} /> Supprimer le compte ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. L'utilisateur <strong>{selectedTech?.name}</strong> perdra tout accès immédiat à la GMAO.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 rounded-xl" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null} Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      <TechnicianTasksDialog 
        technician={selectedTech} 
        isOpen={isTasksOpen} 
        onClose={() => setIsTasksOpen(false)} 
      />
    </div>
  );
};

export default TechniciansPage;