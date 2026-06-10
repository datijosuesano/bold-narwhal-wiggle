import { useState, useEffect } from 'react';

export interface Role {
  id: string;
  name: string;
  label: string;
  color: string;
}

/**
 * SOURCE DE VÉRITÉ FIXE (plus de dépendance DB cassée)
 */
const DEFAULT_ROLES: Role[] = [
  {
    id: '1',
    name: 'admin',
    label: 'Administrateur',
    color: 'bg-red-500'
  },
  {
    id: '2',
    name: 'technicien_biomedical',
    label: 'Technicien Biomédical',
    color: 'bg-blue-500'
  },
  {
    id: '3',
    name: 'secretaire',
    label: 'Secrétaire',
    color: 'bg-green-500'
  },
  {
    id: '4',
    name: 'gestionnaire_stock',
    label: 'Gestionnaire Stock',
    color: 'bg-purple-500'
  }
];

export const useRoles = () => {
  const [roles] = useState<Role[]>(DEFAULT_ROLES);
  const [isLoading] = useState(false);

  const refetch = async () => {
    // volontairement vide (plus de DB fragile)
    console.warn("useRoles: source locale utilisée, pas de refetch nécessaire");
  };

  return { roles, isLoading, refetch };
};