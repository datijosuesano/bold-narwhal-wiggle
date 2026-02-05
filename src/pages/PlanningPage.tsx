import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, Plus, Clock, ListTodo, CalendarPlus } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateWorkOrderForm from "@/components/CreateWorkOrderForm";
import PlanningStats from "@/components/PlanningStats"; 
import { showSuccess } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import DraftsList from "@/components/DraftsList"; // Import du nouveau composant

interface ScheduledEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Maintenance Corrective' | 'Maintenance Préventive' | 'Inspection';
  priority: 'Low' | 'Medium' | 'High';
  isCompleted: boolean;
  completionDate?: Date;
}

const today = new Date();
const initialMockEvents: ScheduledEvent[] = [
  { id: 'E1', title: 'Remplacement filtre', date: today, type: 'Maintenance Préventive', priority: 'Medium', isCompleted: false },
];

const PlanningPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState(initialMockEvents);
  const [draftToSchedule, setDraftToSchedule] = useState<{ title: string } | null>(null);

  const handleWorkOrderSuccess = () => {
    setIsModalOpen(false);
    setDraftToSchedule(null); // Réinitialiser si la création vient d'un brouillon
    showSuccess("Action programmée !");
  };
  
  const handleScheduleDraft = (draft: { title: string }) => {
    setDraftToSchedule(draft);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <CalendarDays className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Planification</h1>
            <p className="text-lg text-muted-foreground">Gérez le calendrier et vos notes d'interventions.</p>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Programmer une Action
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-lg rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {draftToSchedule ? `Programmer: ${draftToSchedule.title}` : "Planifier une maintenance"}
              </DialogTitle>
            </DialogHeader>
            {/* On pourrait pré-remplir le formulaire avec draftToSchedule si nécessaire */}
            <CreateWorkOrderForm onSuccess={handleWorkOrderSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Section Brouillons (Sidebar gauche de la planification) */}
        <div className="lg:col-span-1 space-y-4">
          <DraftsList onSchedule={handleScheduleDraft} />
        </div>

        {/* Vue Calendrier & Stats */}
        <div className="lg:col-span-3 space-y-8">
          <PlanningStats events={events} />
          <CalendarView events={events} onCompleteEvent={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default PlanningPage;