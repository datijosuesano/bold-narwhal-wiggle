/**
 * Constantes métier GMAO Biomédicale - Pipeline Logique
 */

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

/**
 * Statuts correspondants au Pipeline :
 * Panne -> Ouvert
 * Validé/Affecté -> En cours
 * Intervention finie -> Terminé
 */
export const STATUTS_WORK_ORDER = ["Ouvert", "En cours", "En attente de pièce", "Terminé", "Annulé"] as const;
export const WORK_ORDER_STATUS = STATUTS_WORK_ORDER;

// Catégories de documentation normalisées
export const DOCUMENT_CATEGORIES = [
  "Manuel Technique",
  "Schéma / Plan",
  "Certificat de conformité",
  "Procédure d'utilisation",
  "Autre"
] as const;

export const formatRole = (role: string | null): string => {
  if (!role) return "Utilisateur";
  switch (role.toLowerCase()) {
    case 'admin': return 'Administrateur';
    case 'technicien biomedical': return 'Technicien Biomédical';
    case 'gestionnaire de stock': return 'Gestionnaire de Stock';
    case 'secretaire': return 'Administratif';
    case 'user': return 'Collaborateur';
    case 'client': return 'Client Hospitalier';
    default: return role;
  }
};