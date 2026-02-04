import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, Plus } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateWorkOrderForm from "@/components/CreateWorkOrderForm";

// --- Types et Données Mockées ---

interface ScheduledEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Maintenance Corrective' | 'Maintenance Préventive' | 'Inspection';
  priority: 'Low' | 'Medium' | 'High';
}

const initialMockEvents: ScheduledEvent[] = [
  { id: 'E1', title: 'Remplacement filtre P-101', date: new Date(2024, 8, 10), type: 'Maintenance Préventive', priority: 'Medium' },
  { id: 'E2', title: 'Réparation fuite Zone C', date: new Date(2024, 8, 15), type: 'Maintenance Corrective', priority: 'High' },
  { id: 'E3', title: 'Inspection trimestrielle V12', date: new Date(2024, 8, 22), type: 'Inspection', priority: 'Low' },
  { id: 'E4', title: 'Calibration Ligne A', date: new Date(2024, 9, 5), type: 'Maintenance Préventive', priority: 'Medium' },
  { id: 'E5', title: 'Contrôle sécurité Entrepôt', date: new Date(2024, 9, 18), type: 'Inspection', priority: 'Low' },
];

const PlanningPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState(initialMockEvents);

  // Simuler l'ajout d'un nouvel événement après la création d'un OT
  const handleWorkOrderSuccess = () => {
    setIsModalOpen(false);
    // NOTE: Dans une application réelle, nous recevrions les données de l'OT créé.
    // Ici, nous simulons l'ajout d'un événement pour voir l'impact sur le calendrier.
    const newMockEvent: ScheduledEvent = {
      id: `E${events.length + 1}`,
      title: "Nouvelle Tâche Planifiée (Simulée)",
      date: new Date(), // Utilise la date du jour pour la démo
      type: 'Maintenance Préventive',
      priority: 'Medium',
    };
    setEvents(prev => [...prev, newMockEvent]);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <CalendarDays className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">
              Planification de la Maintenance
            </h1>
            <p className="text-lg text-muted-foreground">
              Gérez le calendrier des interventions préventives et correctives.
            </p>
          </div>
        </div>

        {/* Dialog pour créer une nouvelle action (OT) */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 rounded-xl shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Planifier une Action
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-lg rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Créer un Ordre de Travail Planifié</DialogTitle>
              <CardDescription>
                Remplissez les détails pour planifier une nouvelle tâche de maintenance.
              </CardDescription>
            </DialogHeader>
            {/* Réutilisation du formulaire d'OT */}
            <CreateWorkOrderForm onSuccess={handleWorkOrderSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <CalendarView events={events} />
      
      {/* Placeholder for detailed view or filters */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Statistiques de Planification</CardTitle>
          <CardDescription>
            Aperçu des ressources et de la charge de travail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg p-4">
            Indicateurs de performance (à implémenter)
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanningPage;