import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Factory, Clock, TrendingUp } from "lucide-react";

const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold text-primary tracking-tight">
        Tableau de Bord GMAO
      </h1>
      <p className="text-lg text-muted-foreground">
        Aperçu rapide de l'état de la maintenance.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg border-l-4 border-blue-500 transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ordres de Travail Ouverts
            </CardTitle>
            <Wrench className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">42</div>
            <p className="text-xs text-muted-foreground mt-1">
              +2 depuis la semaine dernière
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-l-4 border-green-500 transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Équipements Critiques
            </CardTitle>
            <Factory className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">15</div>
            <p className="text-xs text-muted-foreground mt-1">
              0 en panne actuellement
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-yellow-500 transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Temps Moyen de Réparation (MTTR)
            </CardTitle>
            <Clock className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2.5h</div>
            <p className="text-xs text-muted-foreground mt-1">
              -0.3h par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-purple-500 transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taux de Conformité
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Objectif: 99%
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder for charts/detailed view */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle>Tendances des Ordres de Travail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Graphique de l'évolution (à implémenter)
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Maintenance Préventive vs Corrective</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Diagramme circulaire (à implémenter)
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;