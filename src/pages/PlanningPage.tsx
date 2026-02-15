import React, { useState, useEffect } from "react";
import { CardDays, Plus } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateWorkOrderForm from "@/components/CreateWorkOrderForm";
import PlanningStats from "@/components/PlanningStats"; 
import DraftsList from "@/components/DraftsList";
import { supabase } from "@/integrations/supabase/client";

const PlanningPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('work_orders').select('*');
    if (data) {
      setEvents(data.map(ot => ({
        id: ot.id,
        title: ot.title,
        date: new Date(ot.due_date),
        type: ot.maintenance_type === 'Preventive' ? 'Maintenance Préventive' : 'Maintenance Corrective',
        priority: ot.priority,
        isCompleted: ot.status === 'Completed'
      })));
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl"><Plus className="h-8 w-8 text-blue-600" /></div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Planification</h1>
            <p className="text-lg text-muted-foreground">Calendrier de maintenance temps réel.</p>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 rounded-xl"><Plus className="mr-2 h-4 w-4" /> Programmer</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-xl">
            <CreateWorkOrderForm onSuccess={() => { setIsModalOpen(false); fetchEvents(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1"><DraftsList onSchedule={() => setIsModalOpen(true)} /></div>
        <div className="lg:col-span-3 space-y-8">
          <PlanningStats events={events} />
          <CalendarView events={events} onCompleteEvent={() => fetchEvents()} />
        </div>
      </div>
    </div>
  );
};

export default PlanningPage;