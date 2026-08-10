import React from "react";
import { UseFormReturn } from "react-hook-form";

import {
  ClipboardList,
  Wrench,
  Package,
  Receipt,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { InterventionFormValues } from "../schema";

import type {
  Asset,
  Technician,
  SelectedPart,
} from "../types";

interface Props {
  form: UseFormReturn<InterventionFormValues>;

  parts: SelectedPart[];

  assets: Asset[];

  technicians: Technician[];
}

export default function ReviewStep({
  form,
  parts,
  assets,
  technicians,
}: Props) {
  const values = form.getValues();

  const asset = assets.find(
    (a) => a.id === values.asset_id
  );

  const technician = technicians.find(
    (t) => t.id === values.technician_id
  );

  return (
    <div className="space-y-6">

      {/* ========================= */}
      {/* Informations générales */}
      {/* ========================= */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <ClipboardList size={20} />

            Informations générales

          </CardTitle>

        </CardHeader>

        <CardContent>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

            <div>
              <span className="font-semibold">
                Équipement
              </span>
              <p className="text-muted-foreground">
                {asset?.name || "-"}
              </p>
            </div>

            <div>
              <span className="font-semibold">
                Technicien
              </span>
              <p className="text-muted-foreground">
                {technician?.full_name || "-"}
              </p>
            </div>

            <div>
              <span className="font-semibold">
                Objet
              </span>
              <p className="text-muted-foreground">
                {values.title || "-"}
              </p>
            </div>

            <div>
              <span className="font-semibold">
                Type de maintenance
              </span>
              <p className="text-muted-foreground">
                {values.maintenance_type}
              </p>
            </div>

            <div>
              <span className="font-semibold">
                Lieu
              </span>
              <p className="text-muted-foreground">
                {values.intervention_place}
              </p>
            </div>

            <div>
              <span className="font-semibold">
                Statut
              </span>
              <p className="text-muted-foreground">
                {values.intervention_status}
              </p>
            </div>

          </div>

        </CardContent>

      </Card>

      {/* ========================= */}
      {/* Technique */}
      {/* ========================= */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <Wrench size={20} />

            Partie technique

          </CardTitle>

        </CardHeader>

        <CardContent className="space-y-4 text-sm">

          <div>

            <p className="font-semibold">
              Diagnostic
            </p>

            <p className="text-muted-foreground whitespace-pre-wrap">
              {values.diagnosis || "Aucun"}
            </p>

          </div>

          <div>

            <p className="font-semibold">
              Travaux effectués
            </p>

            <p className="text-muted-foreground whitespace-pre-wrap">
              {values.work_performed || "Aucun"}
            </p>

          </div>

          <div>

            <p className="font-semibold">
              Recommandations
            </p>

            <p className="text-muted-foreground whitespace-pre-wrap">
              {values.recommendations || "Aucune"}
            </p>

          </div>

          <div>

            <span className="font-semibold">
              Temps d'arrêt :
            </span>{" "}

            {values.downtime_minutes} min

          </div>

          {values.intervention_place === "Atelier" &&
            values.accessories_received && (

              <div>

                <p className="font-semibold">
                  Accessoires reçus
                </p>

                <p className="text-muted-foreground whitespace-pre-wrap">
                  {values.accessories_received}
                </p>

              </div>

            )}

        </CardContent>

      </Card>

      {/* ========================= */}
      {/* Pièces */}
      {/* ========================= */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <Package size={20} />

            Pièces détachées

          </CardTitle>

        </CardHeader>

        <CardContent>

          {parts.length === 0 ? (

            <p className="text-sm text-muted-foreground">
              Aucune pièce utilisée.
            </p>

          ) : (

            <div className="space-y-2">

              {parts.map((part, index) => (

                <div
                  key={index}
                  className="flex justify-between border rounded-md p-2"
                >

                  <span>
                    Pièce #{index + 1}
                  </span>

                  <span>

                    Quantité :

                    <strong className="ml-1">
                      {part.quantity}
                    </strong>

                  </span>

                </div>

              ))}

            </div>

          )}

        </CardContent>

      </Card>

      {/* ========================= */}
      {/* Facturation */}
      {/* ========================= */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <Receipt size={20} />

            Facturation

          </CardTitle>

        </CardHeader>

        <CardContent className="space-y-3 text-sm">

          <div>

            <span className="font-semibold">
              Coût total :
            </span>{" "}

            {values.total_cost} FCFA

          </div>

          {values.invoice_number && (

            <div>

              <span className="font-semibold">
                N° Facture :
              </span>{" "}

              {values.invoice_number}

            </div>

          )}

          {values.invoice_status && (

            <div>

              <span className="font-semibold">
                Statut :
              </span>{" "}

              {values.invoice_status}

            </div>

          )}

        </CardContent>

      </Card>

    </div>
  );
}