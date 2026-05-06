-- 1. Mise à jour des rôles autorisés
ALTER TYPE public.role_enum ADD VALUE IF NOT EXISTS 'client';

-- 2. Ajout des colonnes de suivi de facturation
ALTER TABLE public.interventions 
ADD COLUMN IF NOT EXISTS invoice_status TEXT DEFAULT 'Non déposée',
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS invoice_deposited_at TIMESTAMP WITH TIME ZONE;

-- 3. RLS : On supprime la politique si elle existe déjà pour éviter l'erreur 42710
DROP POLICY IF EXISTS "Sec_Update_Invoice_Only" ON public.interventions;

CREATE POLICY "Sec_Update_Invoice_Only" ON public.interventions
FOR UPDATE TO authenticated
USING (get_user_role() = ANY (ARRAY['admin', 'secretaire']))
WITH CHECK (get_user_role() = ANY (ARRAY['admin', 'secretaire']));