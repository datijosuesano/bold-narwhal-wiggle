"use client";

import React from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { useInterventionFormState } from "./hooks/useInterventionFormState";
import GeneralStep from "./steps/GeneralStep";
import TechnicalStep from "./steps/TechnicalStep";
import PartsStep from "./steps/partsStep";
import BillingStep from "./steps/BillingStep";
import ReviewStep from "./steps/ReviewStep";

interface Props {
  initialData?: any;
  onSuccess: () => void;
}

export default function AddPastIntervention({ onSuccess }: Props) {
  const {
    form,
    step,
    loading,
    assets,
    technicians,
    parts,
    setParts,
    nextStep,
    previousStep,
    handleSubmit,
  } = useInterventionFormState(onSuccess);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <GeneralStep
            control={form.control}
            assets={assets}
            technicians={technicians}
          />
        )}

        {step === 2 && (
          <TechnicalStep
            control={form.control}
            watch={form.watch}
          />
        )}

        {step === 3 && (
          <PartsStep
            control={form.control}
            watch={form.watch}
            parts={parts}
            setParts={setParts}
          />
        )}

        {step === 4 && <BillingStep control={form.control} />}

        {step === 5 && (
          <ReviewStep
            form={form}
            parts={parts}
            assets={assets}
            technicians={technicians}
          />
        )}

        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            disabled={step === 1}
            onClick={previousStep}
          >
            <ChevronLeft size={18} className="mr-2" />
            Précédent
          </Button>

          {step < 5 ? (
            <Button type="button" onClick={nextStep}>
              Suivant
              <ChevronRight size={18} className="ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 animate-spin" size={18} />}
              Enregistrer l'intervention
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}