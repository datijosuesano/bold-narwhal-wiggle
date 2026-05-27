-- ====================================================================
-- SCRIPT DE SECURISATION DES ROLES ET POLITIQUES CLIENTS (RLS)
-- ====================================================================

-- 1. SECURITE SUR LA TABLE DES EQUIPEMENTS (assets)
-- Drop des anciennes politiques permissives de lecture globale
DROP POLICY IF EXISTS "Portail_Lecture_Publique_Assets" ON public.assets;
DROP POLICY IF EXISTS "Lecture assets tous" ON public.assets;
DROP POLICY IF EXISTS "Lire équipements" ON public.assets;
DROP POLICY IF EXISTS "Assets_Select" ON public.assets;
DROP POLICY IF EXISTS "lecture_assets" ON public.assets;

-- Politique pour le staff technique (Admin, Tech, Stock, Administratif) : Lecture complète
CREATE POLICY "Staff_Select_All_Assets" ON public.assets
FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'technicien biomedical', 'secretaire', 'gestionnaire de stock')
);

-- Politique pour les comptes Clients (Services Hospitaliers) : Lecture restreinte à leur site
CREATE POLICY "Client_Select_Own_Site_Assets" ON public.assets
FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'client'
  AND
  location = (SELECT site_name FROM public.profiles WHERE id = auth.uid())
);

-- Lecture publique anonyme (uniquement pour le scan QR non-connecté du portail)
CREATE POLICY "Public_QR_Select_Assets" ON public.assets
FOR SELECT TO anon
USING (true);


-- 2. SECURITE SUR LA TABLE DES ORDRES DE TRAVAIL (work_orders)
-- Drop des anciennes politiques permissives de lecture globale
DROP POLICY IF EXISTS "lecture_work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "lecture_globale_work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "Users can manage their own work orders" ON public.work_orders;

-- Politique pour le staff technique : Lecture complète
CREATE POLICY "Staff_Select_All_Work_Orders" ON public.work_orders
FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'technicien biomedical', 'secretaire', 'gestionnaire de stock')
);

-- Politique pour les comptes Clients : Lecture restreinte aux OT de leur site d'affectation
CREATE POLICY "Client_Select_Own_Site_Work_Orders" ON public.work_orders
FOR SELECT TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'client'
  AND
  EXISTS (
    SELECT 1 FROM public.assets 
    WHERE public.assets.id = public.work_orders.asset_id 
    AND public.assets.location = (SELECT site_name FROM public.profiles WHERE id = auth.uid())
  )
);

-- Politique pour autoriser l'insertion publique des pannes via le Portail Client
CREATE POLICY "Portail_Insert_Work_Orders" ON public.work_orders
FOR INSERT TO authenticated, anon
WITH CHECK (true);