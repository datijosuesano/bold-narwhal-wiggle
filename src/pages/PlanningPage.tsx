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

  // Brouillons (Tâches notées non encore programmées)
  const [drafts] = useState([
    { id: 'D1', title: 'Vérifier compresseur salle 4', note: 'Le client signale une chauffe', date: 'Brouillon' },
    { id: 'D2', title: 'Peinture salle bloc', note: 'À faire lors de la fermeture annuelle', date: 'Brouillon' },
  ]);

  const handleWorkOrderSuccess = () => {
    setIsModalOpen(false);
    showSuccess("Action programmée !");
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
              <DialogTitle className="text-2xl font-bold">Planifier une maintenance</DialogTitle>
            </DialogHeader>
            <CreateWorkOrderForm onSuccess={handleWorkOrderSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Section Brouillons (Sidebar gauche de la planification) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-lg border-none bg-slate-50 dark:bg-slate-900/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase flex items-center">
                  <ListTodo size={16} className="mr-2 text-blue-600" /> Brouillons
                </CardTitle>
                <Badge variant="outline" className="rounded-full">{drafts.length}</Badge>
              </div>
              <CardDescription className="text-xs">Tâches à programmer plus tard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {drafts.map(draft => (
                <div key={draft.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-sm hover:border-blue-500 cursor-pointer transition-colors group">
                  <h5 className="text-sm font-bold mb-1">{draft.title}</h5>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{draft.note}</p>
                  <div className="mt-2 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 text-blue-600">
                      <CalendarPlus size={14} />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full border-dashed rounded-xl py-6 hover:bg-blue-50">
                <Plus size={16} className="mr-2"/> Noter une idée
              </Button>
            </CardContent>
          </Card>
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