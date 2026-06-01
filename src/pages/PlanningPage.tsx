import React, { useState, useEffect } from "react";
import { CalendarDays, Plus, CheckCircle2, Loader2, ClipboardList, Check } from "lucide-react";
import CalendarView from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateWorkOrderForm from "@/components/CreateWorkOrderForm";
import PlanningStats from "@/components/PlanningStats"; 
import DraftsList from "@/components/DraftsList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { isToday } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ScheduledEvent {
  id: string;
  title: string;
  date: Date;
  type: 'Maintenance Corrective' | 'Maintenance Préventive' | 'Inspection';
  priority: 'Low' | 'Medium' | 'High';
  isCompleted: boolean;
  assetName?: string;
  assetBrand?: string;
}

const PlanningPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'technicien biomedical']);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, assets(name, brand)');
    
    if (data) {
      setEvents(data.map(ot => ({
        id: ot.id,
        title: ot.title,
        date: new Date(ot.due_date),
        type: ot.maintenance_type === 'Preventive' ? 'Maintenance Préventive' : 'Maintenance Corrective',
        priority: ot.priority,
        isCompleted: ot.status === 'Completed' || ot.status === 'Terminé',
        assetName: ot.assets?.name,
        assetBrand: ot.assets?.brand
      })));
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  // Validation de l'ordre de travail
  const handleCompleteEvent = async (eventId: string) => {
    setIsSubmitting(eventId);
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({ 
          status: 'Completed',
          closed_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) throw error;
      showSuccess("Tâche validée avec succès ! Elle apparaît maintenant comme terminée.");
      fetchEvents();
    } catch (err: any) {
      showError(`Erreur lors de la validation : ${err.message}`);
    } finally {
      setIsSubmitting(null);
    }
  };

  // Filtrer les événements prévus pour aujourd'hui
  const todayEvents = events.filter(event => isToday(event.date));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <CalendarDays className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">Planification</h1>
            <p className="text-lg text-muted-foreground">Calendrier de maintenance temps réel.</p>
          </div>
        </div>

        {canEdit && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 rounded-xl"><Plus className="mr-2 h-4 w-4" /> Programmer</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg rounded-xl">
              <DialogHeader>
                <DialogTitle>Programmer une Intervention</DialogTitle>
              </DialogHeader>
              <CreateWorkOrderForm onSuccess={() => { setIsModalOpen(false); fetchEvents(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Colonne de gauche : Brouillons et Programme du Jour */}
        <div className="lg:col-span-1 space-y-6">
          {/* Nouveau Module : Programme du Jour */}
          <Card className="shadow-lg border-none bg-blue-50/50 border border-blue-100 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase flex items-center text-blue-800">
                <CheckCircle2 size={16} className="mr-2 text-blue-600" /> Programme du Jour
              </CardTitle>
              <CardDescription className="text-xs text-blue-700">Tâches prévues pour aujourd'hui.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {isLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-600 h-5 w-5" /></div>
              ) : todayEvents.length > 0 ? (
                todayEvents.map(event => (
                  <div key={event.id} className={cn(
                    "p-3 rounded-xl border bg-white shadow-sm flex flex-col gap-2 relative transition-all",
                    event.isCompleted && "border-green-100 bg-green-50/10"
                  )}>
                    <div>
                      <h5 className={cn("text-xs font-bold leading-tight", event.isCompleted && "line-through text-slate-400")}>
                        {event.title}
                      </h5>
                      <p className="text-[10px] text-blue-600 font-bold mt-1">
                        {event.assetName || "Appareil inconnu"} 
                        {event.assetBrand && <span className="text-slate-500 font-medium ml-1">({event.assetBrand})</span>}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-slate-50">
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                        event.priority === "High" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"
                      )}>
                        Priorité {event.priority}
                      </span>
                      
                      {!event.isCompleted ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleCompleteEvent(event.id)}
                          className="h-7 text-[10px] font-bold rounded-lg border-green-200 text-green-700 hover:bg-green-50"
                          disabled={isSubmitting === event.id}
                        >
                          {isSubmitting === event.id ? (
                            <Loader2 size={10} className="animate-spin mr-1" />
                          ) : (
                            <Check size={10} className="mr-1" />
                          )}
                          Valider
                        </Button>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 rounded-full text-[9px] font-bold">
                          Fait
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs italic bg-white border border-dashed rounded-xl">
                  Aucune tâche programmée pour aujourd'hui.
                </div>
              )}
            </CardContent>
          </Card>

          <DraftsList onSchedule={() => {
            if (canEdit) setIsModalOpen(true);
          }} />
        </div>

        {/* Colonne principale : Calendrier et KPIs */}
        <div className="lg:col-span-3 space-y-8">
          <PlanningStats events={events} />
          <CalendarView events={events} onCompleteEvent={handleCompleteEvent} />
        </div>
      </div>
    </div>
  );
};

export default PlanningPage;