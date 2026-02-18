-- Mise à jour de la table spare_parts pour inclure le coût d'achat
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS purchase_cost NUMERIC DEFAULT 0;

-- Mise à jour des politiques si nécessaire (déjà activées normalement)