import React from "react";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateWorkOrderForm from "@/components/CreateWorkOrderForm";
import WorkOrdersTable from "@/components/WorkOrdersTable"; // Import du nouveau tableau

const WorkOrdersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleSuccess = () => {
    setIsModalOpen(false);
    // Ici, vous pourriez rafraîchir la liste des OT si elle était implémentée
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-primary tracking-tight">
          Ordres de Travail
        </h1>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <FilePlus className="mr-2 h-4 w-4" /> Créer OT
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-lg rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Créer un nouvel Ordre de Travail</DialogTitle>
              <CardDescription>
                Remplissez les détails pour planifier une nouvelle tâche de maintenance.
              </CardDescription>
            </DialogHeader>
            <CreateWorkOrderForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Liste des Ordres de Travail</CardTitle>
          <CardDescription>
            Suivi des tâches de maintenance en cours, planifiées et terminées.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <WorkOrdersTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkOrdersPage;