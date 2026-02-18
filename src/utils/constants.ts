/**
 * Constantes métier GMAO Biomédicale - 100% Français
 */

export const PRIORITES = ["Faible", "Moyenne", "Élevée", "Critique"] as const;
export const TYPES_MAINTENANCE = ["Préventive", "Corrective", "Curative", "Palliative"] as const;
export const STATUTS_ASSET = ["Opérationnel", "En panne", "En maintenance", "Réformé"] as const;
export const STATUTS_WORK_ORDER = ["Ouvert", "En cours", "Terminé", "Annulé"] as const;
export const TYPES_MOUVEMENT_REACTIF = ["Entrée", "Sortie", "Ajustement"] as const;

export const CATEGORIES_ASSET = ["Imagerie", "Laboratoire", "Bloc Opératoire", "Dentaire", "Stérilisation", "Autre"] as const;
export const SPECIALITES_TECH = ["Biomédical", "Électricien", "Frigoriste", "Plombier", "Polyvalent"] as const;