import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/utils/toast";
import { assetService } from "@/components/Assets/assetService";
import { interventionService } from "../interventionService";
import { InterventionSchema, InterventionFormValues } from "../schema";
import type { Technician, Asset } from "../types";

export function useInterventionFormState(onSuccess: () => void) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [parts, setParts] = useState<{ part_id: string; quantity: number }[]>([]);

  const form = useForm<InterventionFormValues>({
    resolver: zodResolver(InterventionSchema),
    defaultValues: {
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

      await interventionService.createFullIntervention(payload, parts);
      showSuccess("Intervention créée avec succès");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      showError(error.message || "Erreur lors de la création de l'intervention");
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