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
import { Switch } from "@/components/ui/switch";

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


        <div className="rounded-md border bg-muted/40 px-3 py-2">
          <p className="text-sm font-medium">Numéro de facture</p>
          <p className="text-xs text-muted-foreground">Attribué automatiquement : FAC-année-ordre, uniquement si une facture est requise.</p>
        </div>



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

                  <SelectItem value="Non requise">
                    Non requise (sous contrat)
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




      {/* Validation client sans URL ni fichier */}
      <div className="space-y-3 rounded-lg border p-4">
      <FormField
        control={control}
        name="client_validation_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nom du client qui valide</FormLabel>
            <FormControl><Input placeholder="Nom et prénom" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="client_validated"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between gap-4 rounded-md bg-muted/40 p-3">
            <div><FormLabel>Validation client obtenue</FormLabel><p className="text-xs text-muted-foreground">Enregistre la date de validation, sans demander d'URL.</p></div>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      </div>



    </div>
  );
}
