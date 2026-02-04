import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateAssetForm from "@/components/CreateAssetForm";

const AssetsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleSuccess = () => {
    setIsModalOpen(false);
    // Ici, vous pourriez rafraîchir la liste des équipements si elle était implémentée
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-primary tracking-tight">
          Gestion des Équipements
        </h1>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter Équipement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-lg rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Ajouter un nouvel Équipement</DialogTitle>
              <CardDescription>
                Enregistrez les informations de base de votre nouvel actif.
              </CardDescription>
            </DialogH