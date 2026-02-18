/**
 * Constantes métier GMAO Biomédicale - 100% Français
 * Alignées sur les ENUMs PostgreSQL
 */

export const PRIORITES = ["Faible", "Moyenne", "Élevée", "Critique"] as const;
export const TYPES_MAINTENANCE = ["Préventive", "Corrective", "Curative", "Palliative", "Améliorative"] as const;

export const ASSET_STATUS = ["Opérationnel", "En panne", "En maintenance", "Réformé"] as const;
export const ASSET_CATEGORIES = ["Imagerie", "Laboratoire", "Bloc Opératoire", "Dentaire", "Stérilisation", "Autre"] as const;

export const STATUTS_WORK_ORDER = ["Ouvert", "En cours", "Terminé", "Annulé"] as const;
export const TYPES_MOUVEMENT_REACTIF = ["Entrée", "Sortie", "Ajustement"] as const;

export const SPECIALITES_TECH = ["Biomédical", "Électricien", "Frigoriste", "Plombier", "Polyvalent"] as const;
export const REAGENT_UNITS = ["Unité", "Flacon", "Boîte", "ml", "Litre"] as const;