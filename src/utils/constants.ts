/**
 * Constantes métier alignées sur les ENUMs PostgreSQL de la GMAO
 */

export const ASSET_STATUS = ["Opérationnel", "Maintenance", "En Panne"] as const;
export const ASSET_CATEGORIES = ["Imagerie", "Laboratoire", "Bloc Opératoire", "Dentaire", "Stérilisation", "Autre"] as const;

export const WORK_ORDER_STATUS = ["Ouvert", "En cours", "Terminé", "Annulé"] as const;
export const WORK_ORDER_PRIORITY = ["Basse", "Moyenne", "Haute"] as const;
export const MAINTENANCE_TYPES = ["Préventive", "Corrective", "Palliative", "Améliorative"] as const;

export const USER_ROLES = ["admin", "technicien", "gestionnaire_stock", "secretaire", "utilisateur"] as const;
export const TECHNICIAN_SPECIALTIES = ["Biomédical", "Électricien", "Frigoriste", "Plombier", "Polyvalent"] as const;

export const CONTRACT_STATUS = ["Actif", "Échéance Proche", "Expiré"] as const;

export const TOOL_STATUS = ["Disponible", "Attribué", "En Réparation"] as const;

export const REAGENT_UNITS = ["Unité", "Flacon", "Boîte", "ml", "Litre"] as const;

export const REPORT_TYPES = ["Intervention", "Mission", "Audit", "Inventaire"] as const;