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

-- 4. CORRECTION DE LA VUE DES ORDRES DE TRAVAIL (SECURITY INVOKER)
DROP VIEW IF EXISTS public.vue_work_orders_par_priorite;
CREATE VIEW public.vue_work_orders_par_priorite 
WITH (security_invoker = true) 
AS
SELECT 
  priority, 
  count(*) as total 
FROM public.work_orders 
GROUP BY priority;

-- 5. CORRECTION DE LA VUE DES ÉQUIPEMENTS NON-OPÉRANTS (SECURITY INVOKER)
DROP VIEW IF EXISTS public.vue_assets_non_operants;
CREATE VIEW public.vue_assets_non_operants 
WITH (security_invoker = true) 
AS
SELECT * FROM public.assets 
WHERE status != 'Opérationnel';