import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Search, HardHat, CheckCircle2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import TechniciansTable, { Technician } from '@/components/TechniciansTable';
import CreateTechnicianForm from '@/components/CreateTechnicianForm';
import EditTechnicianForm from '@/components/EditTechnicianForm';
import TechnicianTasksDialog from '@/components/TechnicianTasksDialog';

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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Équipe Technique</h1>
            <p className="text-lg text-muted-foreground">Gérez vos techniciens et suivez leur charge de travail.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <UserPlus className="mr-2 h-4 w-4" /> Ajouter Technicien
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Nouveau Technicien</DialogTitle>
              <DialogDescription>Ajoutez un nouveau membre à votre équipe technique.</DialogDescription>
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
          <CardContent><div className="text-3xl font-bold">{initialTechnicians.length} Techniciens</div></CardContent>
        </Card>
        <Card className="shadow-lg border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Disponibles</CardTitle>
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
              <CardTitle>Liste de l'Équipe</CardTitle>
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