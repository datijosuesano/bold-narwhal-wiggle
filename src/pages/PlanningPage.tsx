import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Calendrier des Tâches</CardTitle>
          <CardDescription>
            Visualisation des ordres de travail planifiés.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg p-4">
            Calendrier interactif (à implémenter)
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanningPage;