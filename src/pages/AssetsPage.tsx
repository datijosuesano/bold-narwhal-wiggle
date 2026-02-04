import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AssetsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-primary tracking-tight">
          Gestion des Équipements
        </h1>
        <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
          <PlusCircle className="mr-2 h-4 w-4" /> Ajouter Équipement
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Liste des Actifs</CardTitle>
          <CardDescription>
            Visualisez et gérez tous les équipements de votre installation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg p-4">
            Tableau des équipements (à implémenter)
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetsPage;