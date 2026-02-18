/**
 * Constantes métier GMAO Biomédicale - 100% Français
 * Alignées sur les ENUMs PostgreSQL
 */

// Priorités
export const PRIORITES = ["Faible", "Moyenne", "Élevée", "Critique"] as const;
export const WORK_ORDER_PRIORITY = PRIORITES;

// Types de maintenance
export const TYPES_MAINTENANCE = ["Préventive", "Corrective", "Curative", "Palliative", "Améliorative"] as const;
export const MAINTENANCE_TYPES = TYPES_MAINTENANCE;

// Statuts des équipements
export const ASSET_STATUS = ["Opérationnel", "En panne", "En maintenance", "Réformé"] as const;
export const STATUTS_ASSET = ASSET_STATUS;

// Catégories des équipements
export const ASSET_CATEGORIES = ["Imagerie", "Laboratoire", "Bloc Opératoire", "Dentaire", "Stérilisation", "Autre"] as const;
export const CATEGORIES_ASSET = ASSET_CATEGORIES;

// Statuts des Ordres de Travail
export const STATUTS_WORK_ORDER = ["Ouvert", "En cours", "Terminé", "Annulé"] as const;
export const WORK_ORDER_STATUS = STATUTS_WORK_ORDER;

// Mouvements de stock
export const TYPES_MOUVEMENT_REACTIF = ["Entrée", "Sortie", "Ajustement"] as const;

// Spécialités techniques
export const SPECIALITES_TECH = ["Biomédical", "Électricien", "Frigoriste", "Plombier", "Polyvalent"] as const;

// Unités
export const REAGENT_UNITS = ["Unité", "Flacon", "Boîte", "ml", "Litre"] as const;