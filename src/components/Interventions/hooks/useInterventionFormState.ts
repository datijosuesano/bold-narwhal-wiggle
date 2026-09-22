import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
      client_signature_url: "",
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

  const nextStep = () => setStep((s) => Math.min(5, s + 1));
  const previousStep = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async (values: InterventionFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        user_id: user?.id,
        technician_id: values.technician_id || user?.id,
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
    handleSubmit: form.handleSubmit(onSubmit),
  };
}