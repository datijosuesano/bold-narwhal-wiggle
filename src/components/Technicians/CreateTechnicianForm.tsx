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
          Pour des raisons de sécurité, chaque utilisateur doit créer son propre compte.
        </AlertDescription>
      </Alert>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
        <h4 className="font-bold text-slate-900">Procédure d'ajout :</h4>
        <ol className="list-decimal ml-5 space-y-2 text-sm text-slate-600">
          <li>Envoyez le lien d'inscription au futur collaborateur.</li>
          <li>Il remplit ses informations et **choisit sa spécialité**.</li>
          <li>Une fois inscrit, il apparaîtra dans votre liste d'équipe.</li>
          <li>En tant qu'admin, vous pourrez ensuite valider son rôle (Technicien, Stock, etc.).</li>
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