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
import { Textarea } from "@/components/ui/textarea";

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
  assets: any[];
  technicians: any[];
}

export default function GeneralStep({
  control,
  assets,
  technicians,
}: Props) {
  return (
    <div className="space-y-6">

      {/* RIT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <FormField
          control={control}
          name="rit_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>N° RIT</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="physical_rit_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>N° RIT Physique</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

      </div>

      {/* Equipement */}
      <FormField
        control={control}
        name="asset_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Équipement *</FormLabel>

            <Select
              value={field.value}
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un équipement" />
                </SelectTrigger>
              </FormControl>

              <SelectContent>

                {assets.map((asset) => (
                  <SelectItem
                    key={asset.id}
                    value={asset.id}
                  >
                    {asset.name}
                  </SelectItem>
                ))}

              </SelectContent>

            </Select>

            <FormMessage />
          </FormItem>
        )}
      />

      {/* Technicien */}
      <FormField
        control={control}
        name="technician_id"
        render={({ field }) => (
          <FormItem>

            <FormLabel>Technicien</FormLabel>

            <Select
              value={field.value}
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un technicien" />
                </SelectTrigger>
              </FormControl>

              <SelectContent>

                {technicians.map((tech) => (
                  <SelectItem
                    key={tech.id}
                    value={tech.id}
                  >
                    {tech.full_name}
                  </SelectItem>
                ))}

              </SelectContent>

            </Select>

            <FormMessage />
          </FormItem>
        )}
      />

      {/* Objet */}
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>

            <FormLabel>Objet *</FormLabel>

            <FormControl>
              <Input {...field} />
            </FormControl>

            <FormMessage />

          </FormItem>
        )}
      />

      {/* Description */}
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>

            <FormLabel>Description</FormLabel>

            <FormControl>
              <Textarea
                rows={4}
                {...field}
              />
            </FormControl>

            <FormMessage />

          </FormItem>
        )}
      />

      {/* Type + Lieu */}
      <div className="grid md:grid-cols-2 gap-4">

        <FormField
          control={control}
          name="maintenance_type"
          render={({ field }) => (
            <FormItem>

              <FormLabel>Type de maintenance</FormLabel>

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

                  <SelectItem value="Préventive">
                    Préventive
                  </SelectItem>

                  <SelectItem value="Curative">
                    Curative
                  </SelectItem>

                  <SelectItem value="Installation">
                    Installation
                  </SelectItem>

                  <SelectItem value="Contrôle Qualité">
                    Contrôle Qualité
                  </SelectItem>

                </SelectContent>

              </Select>

            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="intervention_place"
          render={({ field }) => (
            <FormItem>

              <FormLabel>Lieu</FormLabel>

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

                  <SelectItem value="Sur Site">
                    Sur Site
                  </SelectItem>

                  <SelectItem value="Atelier">
                    Atelier
                  </SelectItem>

                  <SelectItem value="Télémaintenance">
                    Télémaintenance
                  </SelectItem>

                </SelectContent>

              </Select>

            </FormItem>
          )}
        />

      </div>

      {/* Date + Statut */}
      <div className="grid md:grid-cols-2 gap-4">

        <FormField
          control={control}
          name="intervention_date"
          render={({ field }) => (
            <FormItem>

              <FormLabel>Date intervention</FormLabel>

              <FormControl>
                <Input
                  type="date"
                  {...field}
                />
              </FormControl>

            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="intervention_status"
          render={({ field }) => (
            <FormItem>

              <FormLabel>Statut</FormLabel>

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

                  <SelectItem value="Planifiée">
                    Planifiée
                  </SelectItem>

                  <SelectItem value="En cours">
                    En cours
                  </SelectItem>

                  <SelectItem value="Terminée">
                    Terminée
                  </SelectItem>

                  <SelectItem value="Suspendue">
                    Suspendue
                  </SelectItem>

                  <SelectItem value="Annulée">
                    Annulée
                  </SelectItem>

                </SelectContent>

              </Select>

            </FormItem>
          )}
        />

      </div>

    </div>
  );
}