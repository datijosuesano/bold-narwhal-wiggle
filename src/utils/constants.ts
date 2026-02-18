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

export const PRIORITES = ["Faible", "Moyenne", "Élevée", "Critique"] as const;
export const MAINTENANCE_TYPES = ["Préventive", "Corrective", "Curative", "Palliative", "Améliorative"] as const;
export const STATUTS_WORK_ORDER = ["Ouvert", "En cours", "Terminé", "Annulé"] as const;