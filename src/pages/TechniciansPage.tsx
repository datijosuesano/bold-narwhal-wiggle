import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Search, HardHat, CheckCircle2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import TechniciansTable, { Technician } from '@/components/TechniciansTable';
import CreateTechnicianForm from '@/components/CreateTechnicianForm';
import EditTechnicianForm from '@/components/EditTechnicianForm';
import TechnicianTasksDialog from '@/components/TechnicianTasksDialog';
import { showSuccess } from '@/utils/toast';

const initialTechnicians: Technician[] = [
  { id: 'TECH-01', name: 'Jean Dupont', specialty: 'Biomédical', status: 'InIntervention', activeOrders: 3, phone: '06 12 34 56 78', email: 'j.dupont@clinique.fr' },
  { id: 'TECH-02', name: 'Marc Voisin', specialty: 'Electricien', status: 'Available', activeOrders: 0, phone: '06 87 65 43 21', email: 'm.voisin@clinique.fr' },
  { id: 'TECH-03', name: 'Sophie Laurent', specialty: 'Frigoriste', status: 'Available', activeOrders: 1, phone: '07 11 22 33 44', email: 's.laurent@clinique.fr' },
  { id: 'TECH-04', name: 'Ahmed Bensaid', specialty: 'Plombier', status: 'OnLeave', activeOrders: 0, phone: '06 55 44 33 22', email: 'a.bensaid@clinique.fr' },
];

const TechniciansPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);

  const filteredTechnicians = useMemo(() => {
    return initialTechnicians.filter(tech => 
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleEdit = (tech: Technician) => {
    setSelectedTech(tech);
    setIsEditOpen(true);
  };

  const handleShowTasks = (tech: Technician) => {
    setSelectedTech(tech);
    setIsTasksOpen(true);
  };

  const handleDeleteClick = (tech: Technician) => {
    setSelectedTech(tech);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTech) {
      showSuccess(`Technicien ${selectedTech.name} supprimé avec succès.`);
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
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Gestion des Utilisateurs</h1>
            <p className="text-lg text-muted-foreground">Créez et gérez les comptes utilisateurs et leurs rôles.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <UserPlus className="mr-2 h-4 w-4" /> Créer Utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Nouveau Compte Utilisateur</DialogTitle>
              <DialogDescription>Créez un nouveau compte et assignez-lui un rôle dans l'entreprise.</DialogDescription>
            </DialogHeader>
            <CreateTechnicianForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-lg border-l-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Effectif Total</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{initialTechnicians.length} Utilisateurs</div></CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Techniciens Disponibles</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{initialTechnicians.filter(t => t.status === 'Available').length} Disponibles</div></CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Charge Moyenne</CardTitle>
            <HardHat className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(initialTechnicians.reduce((acc, t) => acc + t.activeOrders, 0) / initialTechnicians.length).toFixed(1)} OT / Tech
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Liste des Utilisateurs</CardTitle>
              <CardDescription>Suivi des disponibilités et des interventions en cours.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Rechercher par nom, spécialité..." 
                className="pl-10 rounded-xl" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TechniciansTable 
            technicians={filteredTechnicians} 
            onEdit={handleEdit}
            onShowTasks={handleShowTasks}
            onDelete={handleDeleteClick}
          />
        </CardContent>
      </Card>

      {/* Modale de Modification */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Modifier le Technicien</DialogTitle>
            <DialogDescription>Mettez à jour les informations de {selectedTech?.name}.</DialogDescription>
          </DialogHeader>
          {selectedTech && (
            <EditTechnicianForm 
              technician={selectedTech} 
              onSuccess={() => setIsEditOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Alerte de Suppression */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement le profil de {selectedTech?.name} de la base de données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modale des Tâches Assignées */}
      <TechnicianTasksDialog 
        technician={selectedTech} 
        isOpen={isTasksOpen} 
        onClose={() => setIsTasksOpen(false)} 
      />
    </div>
  );
};

export default TechniciansPage;