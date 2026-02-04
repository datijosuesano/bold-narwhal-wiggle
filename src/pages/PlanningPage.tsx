import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, Plus } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateWorkOrderForm from "@/components/CreateWorkOrderForm";
import PlanningStats from "@/components/PlanningStats"; 
import { showSuccess } from "@/utils/toast";

// --- Types et Données Mockées ---

interface ScheduledEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Maintenance Corrective' | 'Maintenance Préventive' | 'Inspection';
  priority: 'Low' | 'Medium' | 'High';
  isCompleted: boolean; // Nouveau champ
  completionDate?: Date; // Date de complétion
}

// Définition des dates pour la démo
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const inTwoDays = new Date(today);
inTwoDays.setDate(today.getDate() + 2);
const nextMonth = new Date(today);
nextMonth.setMonth(today.getMonth() + 1);


const initialMockEvents: ScheduledEvent[] = [
  // Urgent (Dépassé)
  { id: 'E1', title: 'Remplacement filtre (URGENT)', date: yesterday, type: 'Maintenance Préventive', priority: 'Medium', isCompleted: false },
  // Warning (Proche)
  { id: 'E2', title: 'Réparation fuite (PROCHE)', date: inTwoDays, type: 'Maintenance Corrective', priority: 'High', isCompleted: false },
  // Normal (Futur)
  { id: 'E3', title: 'Inspection trimestrielle V12', date: nextMonth, type: 'Inspection', priority: 'Low', isCompleted: false },
  { id: 'E4', title: 'Graissage mensuel', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10), type: 'Maintenance Préventive', priority: 'Low', isCompleted: false },
  { id: 'E5', title: 'Contrôle sécurité', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), type: 'Inspection', priority: 'Medium', isCompleted: false },
  // Tâche terminée hier, avec date de complétion
  { id: 'E6', title: 'Tâche terminée hier', date: yesterday, type: 'Inspection', priority: 'Low', isCompleted: true, completionDate: yesterday },
];

const PlanningPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState(initialMockEvents);

  // Fonction pour marquer un événement comme terminé
  const handleCompleteEvent = (eventId: string) => {
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              isCompleted: true, 
              completionDate: new Date() // Enregistre la date de complétion
            } 
          : event
      )
    );
    showSuccess("Action marquée comme terminée !");
  };

  // Simuler l'ajout d'un nouvel événement après la création d'un OT
  const handleWorkOrderSuccess = () => {
    setIsModalOpen(false);
    const newMockEvent: ScheduledEvent = {
      id: `E${events.length + 1}`,
      title: "Nouvelle Tâche Planifiée (Simulée)",
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7), // Planifié dans 7 jours
      type: 'Maintenance Préventive',
      priority: 'Medium',
      isCompleted: false,
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

      {/* Intégration des statistiques */}
      <PlanningStats events={events} />

      <CalendarView events={events} onCompleteEvent={handleCompleteEvent} />
      
    </div>
  );
};

export default PlanningPage;