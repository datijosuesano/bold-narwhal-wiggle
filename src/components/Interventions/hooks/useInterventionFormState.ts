import { useState, useEffect } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import { assetService } from "@/components/Assets/assetService";
import { interventionService } from "../interventionService";
import { InterventionSchema, InterventionFormValues } from "../schema";
import type { Technician, Asset } from "../types";

// 1. Ajouter initialData aux paramètres
export function useInterventionFormState(onSuccess: () => void, initialData?: any) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  
  // Si initialData contient déjà des pièces, on pourrait les charger ici.
  // Pour l'instant, on initialise avec un tableau vide par défaut.
  const [parts, setParts] = useState<{ part_id: string; quantity: number }[]>([]);

  // 2. Utiliser initialData s'il existe, sinon utiliser les valeurs vides
  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: initialData || {
      rit_number: "",
      physical_rit_number: "",
      asset_id: "",
      technician_id: "",
      title: "",
      description: "",
      maintenance_type: "Curative",
      intervention_place: "Sur Site",
      intervention_status: "Terminée",
      intervention_date: new Date().toISOString().split("T")[0],
      start_date: "",
      end_date: "",
      diagnosis: "",
      work_performed: "",
      recommendations: "",
      accessories_received: "",
      downtime_minutes: 0,
      parts_replaced: false,
      invoice_number: "",
      invoice_status: "Non déposée",
      invoice_deposited_at: "",
      total_cost: 0,
      client_validation_name: "",
      client_validated: false,
    },
  });

  useEffect(() => {
    async function loadDependencies() {
      try {
        const [assetsData, techData] = await Promise.all([
          assetService.getAllAssets(),
          interventionService.getTechnicians(),
        ]);
        setAssets(assetsData || []);
        setTechnicians(techData || []);
      } catch (error) {
        console.error(error);
        showError("Erreur lors du chargement des données.");
      }
    }
    loadDependencies();
  }, []);

  const nextStep = async () => {
    // Validate the required information before the user reaches the final
    // review. Previously errors could remain hidden on step 1, making the
    // final save button appear unresponsive.
    if (step === 1) {
      const isValid = await form.trigger(["asset_id", "title"]);
      if (!isValid) {
        showError("Renseignez l'équipement et l'objet de l'intervention pour continuer.");
        return;
      }
    }
    setStep((currentStep) => Math.min(5, currentStep + 1));
  };
  const previousStep = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async (values: InterventionFormValues) => {
    if (!user?.id) {
      showError("Votre session a expiré. Reconnectez-vous avant d'enregistrer l'intervention.");
      return;
    }
    setLoading(true);
    try {
      const { rit_number, invoice_number, ...editableValues } = values;
      const payload = {
        ...editableValues,
        user_id: user.id,
        technician_id: values.technician_id || user.id,
        // PostgreSQL timestamp columns reject an empty string. The form uses an
        // empty value until the operator provides a date, so send null instead.
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        invoice_deposited_at: values.invoice_deposited_at || null,
        client_validated_at: values.client_validated ? new Date().toISOString() : null,
        // Older deployments require work_details; keep it populated alongside
        // the newer structured fields used by the interface.
        work_details: values.work_performed || values.description || "Intervention enregistrée.",
      };

      // 3. Le branchement logique : Update si on a un ID, sinon Create
      if (initialData?.id) {
        // Mode Modification
        await interventionService.update(initialData.id, payload);
        
        // Note : Si vous modifiez aussi les pièces (parts) lors d'une mise à jour,
        // il faudra ajouter la logique correspondante ici ou dans votre service.
        
        showSuccess("Intervention modifiée avec succès");
      } else {
        // Mode Création
        await interventionService.createFullIntervention(payload, parts);
        showSuccess("Intervention créée avec succès");
      }
      
      onSuccess();
    } catch (error: any) {
      console.error(error);
      showError(error.message || "Erreur lors de l'enregistrement de l'intervention");
    } finally {
      setLoading(false);
    }
  };

  const onInvalidSubmit = (errors: FieldErrors<InterventionFormValues>) => {
    const firstField = Object.keys(errors)[0] as keyof InterventionFormValues | undefined;
    setStep(1);
    showError("L'intervention n'a pas été enregistrée : vérifiez l'équipement et l'objet à l'étape Informations générales.");
    if (firstField) form.setFocus(firstField);
  };

  return {
    form,
    step,
    loading,
    assets,
    technicians,
    parts,
    setParts,
    nextStep,
    previousStep,
    handleSubmit: form.handleSubmit(onSubmit, onInvalidSubmit),
  };
}
