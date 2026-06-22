// src/lib/roles.ts

export const ROLE_MAP: Record<string, string> = {
  admin: "Administrateur",
  technicien_biomedical: "Technicien Biomédical",
  gestionnaire_stock: "Gestionnaire de Stock",
  secretaire: "Secretaire", 
  client: "Client"
};

export const getRoleLabel = (role: string | undefined | null): string => {
  if (!role) return "Non défini";
  return ROLE_MAP[role as keyof typeof ROLE_MAP] || role;
};