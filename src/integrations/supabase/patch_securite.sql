-- 1. SECURISATION DE LA TABLE TOOLS (OUTILLAGE)
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accès outils authentifiés" ON public.tools;
CREATE POLICY "Accès outils authentifiés" ON public.tools 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- 2. SECURISATION DE LA TABLE SPARE_PARTS (PIECES)
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accès pièces authentifiées" ON public.spare_parts;
CREATE POLICY "Accès pièces authentifiées" ON public.spare_parts 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. SECURISATION DES MOUVEMENTS DE REACTIFS
ALTER TABLE public.lab_reagent_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accès mouvements authentifiés" ON public.lab_reagent_movements;
CREATE POLICY "Accès mouvements authentifiés" ON public.lab_reagent_movements 
FOR ALL TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. FIX SECURITY : Empêcher le détournement du search_path sur les fonctions sensibles
ALTER FUNCTION public.get_user_role() SET search_path = '';

-- 5. SECURISATION DES DOCUMENTS D'EQUIPEMENTS
ALTER TABLE public.asset_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow_All_Docs" ON public.asset_documents;
DROP POLICY IF EXISTS "Docs_select_policy" ON public.asset_documents;
DROP POLICY IF EXISTS "Docs_insert_policy" ON public.asset_documents;
DROP POLICY IF EXISTS "Docs_update_policy" ON public.asset_documents;
DROP POLICY IF EXISTS "Docs_delete_policy" ON public.asset_documents;

CREATE POLICY "Docs_select_policy" ON public.asset_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Docs_insert_policy" ON public.asset_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Docs_update_policy" ON public.asset_documents FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Docs_delete_policy" ON public.asset_documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. CORRECTION DES VUES (SECURITY INVOKER)
DROP VIEW IF EXISTS public.vue_work_orders_par_priorite;
CREATE VIEW public.vue_work_orders_par_priorite WITH (security_invoker = true) AS
SELECT priority, count(*) as total FROM public.work_orders GROUP BY priority;

DROP VIEW IF EXISTS public.vue_assets_non_operants;
CREATE VIEW public.vue_assets_non_operants WITH (security_invoker = true) AS
SELECT * FROM public.assets WHERE status != 'Opérationnel';