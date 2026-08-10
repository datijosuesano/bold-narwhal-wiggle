import React from "react";
import { Control, UseFormWatch } from "react-hook-form";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Switch } from "@/components/ui/switch";

import { InterventionFormValues } from "../schema";
import InterventionPartsSelector from "../InterventionPartsSelector";


interface Props {
  control: Control<InterventionFormValues>;
  watch: UseFormWatch<InterventionFormValues>;

  parts: {
    part_id: string;
    quantity: number;
  }[];

  setParts: (
    value: {
      part_id: string;
      quantity: number;
    }[]
  ) => void;
}


export default function PartsStep({
  control,
  watch,
  parts,
  setParts,
}: Props) {


  const partsReplaced = watch("parts_replaced");


  return (
    <div className="space-y-6">


      {/* Switch pièces remplacées */}
      <FormField
        control={control}
        name="parts_replaced"
        render={({ field }) => (
          <FormItem
            className="
              flex items-center justify-between
              rounded-xl border p-4
            "
          >

            <div>

              <FormLabel className="text-base">
                Des pièces ont-elles été remplacées ?
              </FormLabel>

              <p className="text-sm text-muted-foreground">
                Activez cette option si des pièces
                détachées ont été utilisées.
              </p>

            </div>


            <FormControl>

              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />

            </FormControl>


            <FormMessage />

          </FormItem>
        )}
      />



      {/* Sélecteur pièces */}
      {partsReplaced && (

        <div
          className="
            rounded-xl border p-4
            bg-slate-50
          "
        >

          <h3 className="font-semibold mb-4">
            Pièces utilisées
          </h3>


          <InterventionPartsSelector
            value={parts}
            onChange={setParts}
          />


        </div>

      )}


    </div>
  );
}