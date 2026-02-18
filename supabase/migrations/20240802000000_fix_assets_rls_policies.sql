-- S'assurer que RLS est activé sur toutes les tables principales
ALTER TABLE IF EXISTS public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lab_reagents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table 'assets' (Équipements)
DROP POLICY IF EXISTS "Users can view their own assets" ON public.assets;
CREATE POLICY "Users can view their own assets" ON public.assets
FOR SELECT TO authenticated USING (true); -- On autorise la lecture par tous les membres (collaboration)

DROP POLICY IF EXISTS "Users can insert their own assets" ON public.assets;
CREATE POLICY "Users can insert their own assets" ON public.assets
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own assets" ON public.assets;
CREATE POLICY "Users can update their own assets" ON public.assets
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own assets" ON public.assets;
CREATE POLICY "Users can delete their own assets" ON public.assets
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Note: On applique des politiques similaires pour les autres tables si nécessaire
-- Pour simplifier et résoudre le problème immédiat de l'utilisateur sur 'assets'