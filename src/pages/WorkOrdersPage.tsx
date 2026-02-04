import React from "react";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const WorkOrdersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-primary tracking-tight">
          Ordres de Travail
        </h1>
        <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
          <FilePlus className="mr-2 h-4 w-4" /> Créer OT
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Liste des Ordres de Travail</CardTitle>
          <CardDescription>
            Suivi des tâches de maintenance en cours, planifiées et terminées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg p-4">
            Tableau des ordres de travail (à implémenter)
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkOrdersPage;