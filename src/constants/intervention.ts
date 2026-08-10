/* ==========================================================
   TYPES DE MAINTENANCE
========================================================== */

export const MAINTENANCE_TYPES = [
  "Corrective",
  "Préventive",
  "Curative",
  "Installation",
  "Calibration",
  "Contrôle Qualité",
] as const;

/* ==========================================================
   STATUTS D'INTERVENTION
========================================================== */

export const INTERVENTION_STATUSES = [
  "En attente",
  "En cours",
  "Terminée",
  "Annulée",
] as const;

/* ==========================================================
   STATUTS DE FACTURATION
========================================================== */

export const INVOICE_STATUSES = [
  "Non facturé",
  "Facturé",
  "Déposé",
  "Payé",
] as const;

/* ==========================================================
   LIEUX D'INTERVENTION
========================================================== */

export const INTERVENTION_PLACES = [
  "Sur Site",
  "Atelier Biomédical",
  "Sous-traitant",
  "Fabricant",
] as const;

/* ==========================================================
   ACCESSOIRES COURANTS
========================================================== */

export const ACCESSORIES = [
  "Câble d'alimentation",
  "Sonde",
  "Capteur",
  "Batterie",
  "Support",
  "Télécommande",
  "Manuel utilisateur",
  "Pédale",
  "Adaptateur",
] as const;

/* ==========================================================
   COULEURS DES BADGES
========================================================== */

export const INTERVENTION_STATUS_COLORS: Record<string, string> = {
  "En attente": "bg-yellow-100 text-yellow-700",
  "En cours": "bg-blue-100 text-blue-700",
  "Terminée": "bg-green-100 text-green-700",
  "Annulée": "bg-red-100 text-red-700",
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  "Non facturé": "bg-gray-100 text-gray-700",
  "Facturé": "bg-blue-100 text-blue-700",
  "Déposé": "bg-orange-100 text-orange-700",
  "Payé": "bg-green-100 text-green-700",
};

/* ==========================================================
   VALEURS PAR DÉFAUT
========================================================== */

export const DEFAULT_INTERVENTION_VALUES = {
  maintenance_type: "Corrective",
  intervention_status: "En attente",
  invoice_status: "Non facturé",
  intervention_place: "Sur Site",
  total_cost: 0,
  downtime_minutes: 0,
  parts_replaced: false,
} as const;