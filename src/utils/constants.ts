/**
 * Constantes métier GMAO Biomédicale
 */

// Catégories des équipements avec mapping Valeur (DB) / Label (UI)
export const ASSET_CATEGORIES = [
  { value: "imagerie", label: "Imagerie" },
  { value: "laboratoire", label: "Laboratoire" },
  { value: "bloc_operatoire", label: "Bloc Opératoire" },
  { value: "dentaire", label: "Dentaire" },
  { value: "sterilisation", label: "Stérilisation" },
  { value: "autre", label: "Autre" }
] as const;

export const ASSET_STATUS = ["Opérationnel", "En panne", "En maintenance", "Réformé"] as const;

// Priorités
export const PRIORITES = ["Faible", "Moyenne", "Élevée", "Critique"] as const;
export const WORK_ORDER_PRIORITY = PRIORITES;

// Types de maintenance
export const TYPES_MAINTENANCE = ["Préventive", "Corrective", "Curative", "Palliative", "Améliorative"] as const;
export const MAINTENANCE_TYPES = TYPES_MAINTENANCE;

// Statuts des Ordres de Travail
export const STATUTS_WORK_ORDER = ["Ouvert", "En cours", "En attente de pièce", "Terminé", "Annulé"] as const;
export const WORK_ORDER_STATUS = STATUTS_WORK_ORDER;