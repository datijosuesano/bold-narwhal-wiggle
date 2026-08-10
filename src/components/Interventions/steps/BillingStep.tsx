import React from "react";
import { Control } from "react-hook-form";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { InterventionFormValues } from "../schema";


interface Props {
  control: Control<InterventionFormValues>;
}


export default function BillingStep({
  control,
}: Props) {

  return (
    <div className="space-y-6">


      {/* Coût total */}
      <FormField
        control={control}
        name="total_cost"
        render={({ field }) => (
          <FormItem>

            <FormLabel>
              Coût total intervention
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



      {/* Facturation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


        <FormField
          control={control}
          name="invoice_number"
          render={({ field }) => (
            <FormItem>

              <FormLabel>
                Numéro facture
              </FormLabel>

              <FormControl>
                <Input
                  placeholder="Ex: FAC-2026-001"
                  {...field}
                />
              </FormControl>

              <FormMessage />

            </FormItem>
          )}
        />



        <FormField
          control={control}
          name="invoice_status"
          render={({ field }) => (
            <FormItem>

              <FormLabel>
                Statut facture
              </FormLabel>


              <Select
                value={field.value}
                onValueChange={field.onChange}
              >

                <FormControl>

                  <SelectTrigger>

                    <SelectValue />

                  </SelectTrigger>

                </FormControl>


                <SelectContent>

                  <SelectItem value="Non déposée">
                    Non déposée
                  </SelectItem>


                  <SelectItem value="Déposée">
                    Déposée
                  </SelectItem>


                  <SelectItem value="Payée">
                    Payée
                  </SelectItem>


                  <SelectItem value="Annulée">
                    Annulée
                  </SelectItem>


                </SelectContent>


              </Select>


              <FormMessage />

            </FormItem>
          )}
        />

      </div>




      {/* Date dépôt facture */}
      <FormField
        control={control}
        name="invoice_deposited_at"
        render={({ field }) => (
          <FormItem>

            <FormLabel>
              Date dépôt facture
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




      {/* Signature */}
      <FormField
        control={control}
        name="client_signature_url"
        render={({ field }) => (
          <FormItem>

            <FormLabel>
              Signature client
            </FormLabel>


            <FormControl>

              <Input
                placeholder="URL signature ou fichier uploadé"
                {...field}
              />

            </FormControl>


            <p className="text-xs text-muted-foreground">
              Ce champ sera remplacé ensuite par le composant SignaturePad.
            </p>


            <FormMessage />

          </FormItem>
        )}
      />



    </div>
  );
}