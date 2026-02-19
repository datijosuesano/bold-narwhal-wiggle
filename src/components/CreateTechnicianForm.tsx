"use client";

import React from "react";
import { AlertCircle, UserPlus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";

interface CreateTechnicianFormProps {
  onSuccess: () => void;
}

const CreateTechnicianForm: React.FC<CreateTechnicianFormProps> = ({ onSuccess }) => {
  return (
    <div className="space-y-6 py-4">
      <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="font-bold">Action Requise</AlertTitle>
        <AlertDescription>
          En raison de la sécurité de la base de données (RLS), vous ne pouvez pas créer de profil manuellement. 
          Le technicien doit d'abord **créer son propre compte** via la page d'inscription.
        </AlertDescription>
      </Alert>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
        <h4 className="font-bold text-slate-900">Procédure d'ajout :</h4>
        <ol className="list-decimal ml-5 space-y-2 text-sm text-slate-600">
          <li>Le technicien se rend sur la page <strong>/register</strong>.</li>
          <li>Il crée son compte avec son email professionnel.</li>
          <li>Une fois inscrit, son nom apparaîtra automatiquement dans la liste.</li>
          <li>Vous pourrez alors cliquer sur "Modifier" pour lui assigner sa spécialité.</li>
        </ol>
      </div>

      <div className="flex flex-col gap-2">
        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12 font-bold shadow-lg">
          <Link to="/register" target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" /> Ouvrir la page d'inscription
          </Link>
        </Button>
        <Button variant="ghost" onClick={onSuccess} className="w-full">
          Fermer
        </Button>
      </div>
    </div>
  );
};

export default CreateTechnicianForm;