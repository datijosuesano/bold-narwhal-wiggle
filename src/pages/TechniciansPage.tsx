import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Search, HardHat, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import TechniciansTable, { Technician } from '@/components/TechniciansTable';
import CreateTechnicianForm from '@/components/CreateTechnicianForm';
import EditTechnicianForm from '@/components/EditTechnicianForm';
import TechnicianTasksDialog from '@/components/TechnicianTasksDialog';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const TechniciansPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['admin']);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTechnicians = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('last_login', { ascending: false });

    if (error) {
      showError("Erreur lors du chargement des profils.");
    } else {
      const mapped: Technician[] = (data || []).map(p => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
        return {
          id: p.id,
          name: fullName || p.email || 'Utilisateur sans nom',
          specialty: p.specialite || (p.role === 'user' ? 'Nouveau compte' : 'Non défini'),
          status: p.status || 'Available',
          activeOrders: 0,
          phone: p.telephone || 'N/A',
          email: p.email || 'N/A',
          last_login: p.last_login
        };
      });
      setTechnicians(mapped);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const filteredTechnicians = useMemo(() => {
    return technicians.filter(tech => 
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [technicians, searchTerm]);

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
    setSelectedTech(tech);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedTech) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedTech.id);

      if (error) {
        showError("Erreur lors de la suppression.");
      } else {
        showSuccess(`Profil supprimé.`);
        fetchTechnicians();
      }
      setIsDeleteOpen(false);
      setSelectedTech(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Utilisateurs & Équipe</h1>
            <p className="text-lg text-muted-foreground">Consultez les membres de l'équipe technique.</p>
          </div>
        </div>
        
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
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

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Liste des comptes</CardTitle>
              <CardDescription>
                {isAdmin ? "Cliquez sur Modifier pour finaliser un profil." : "Liste des collaborateurs en lecture seule."}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Chercher nom ou email..." 
                className="pl-10 rounded-xl" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="animate-spin h-10 w-10 mx-auto text-blue-600 mb-4" />
              <p className="text-muted-foreground">Chargement des profils...</p>
            </div>
          ) : (
            <TechniciansTable 
              technicians={filteredTechnicians} 
              onEdit={handleEdit}
              onShowTasks={handleShowTasks}
              onDelete={handleDeleteClick}
              canManage={isAdmin}
            />
          )}
        </CardContent>
      </Card>

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
                  onSuccess={() => { setIsEditOpen(false); fetchTechnicians(); }} 
                />
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent className="rounded-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer le compte ?</AlertDialogTitle>
                <AlertDialogDescription>Cette action retirera définitivement l'accès à cet utilisateur.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">Supprimer</AlertDialogAction>
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