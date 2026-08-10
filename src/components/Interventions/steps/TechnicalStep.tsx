import React from "react";
import { Control, UseFormWatch } from "react-hook-form";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { InterventionFormValues } from "../schema";

interface Props {
  control: Control<InterventionFormValues>;
  watch: UseFormWatch<InterventionFormValues>;
}

export default function TechnicalStep({
  control,
  watch,
}: Props) {
  // On écoute le champ "intervention_place" défini dans l'étape précédente
  const interventionPlace = watch("intervention_place");

  return (
    <div className="space-y-6">

      {/* Dates intervention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <FormField
          control={control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Date et heure de début
              </FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Date et heure de fin
              </FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

      </div>

      {/* Temps arrêt */}
      <FormField
        control={control}
        name="downtime_minutes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Temps d'arrêt équipement (minutes)
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                value={field.value ?? 0}
                onChange={(e) =>
                  field.onChange(
                    Number(e.target.value)
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Diagnostic */}
      <FormField
        control={control}
        name="diagnosis"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Diagnostic
            </FormLabel>
            <FormControl>
              <Textarea
                rows={4}
                placeholder="Décrire la panne ou le constat..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Travaux réalisés */}
      <FormField
        control={control}
        name="work_performed"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Travaux effectués
            </FormLabel>
            <FormControl>
              <Textarea
                rows={5}
                placeholder="Décrire les opérations réalisées..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Recommandations */}
      <FormField
        control={control}
        name="recommendations"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Recommandations
            </FormLabel>
            <FormControl>
              <Textarea
                rows={4}
                placeholder="Actions recommandées..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Accessoires reçus (uniquement si intervention en atelier) */}
      {interventionPlace === "Atelier" && (
        <FormField
          control={control}
          name="accessories_received"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Accessoires reçus
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Accessoires ou éléments reçus avec l'équipement..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

    </div>
  );
}