import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import CalendarView from "@/components/CalendarView";

const PlanningPage: React.FC = () => {
  return (
    <div className="space-y-8">
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

      <CalendarView />
      
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