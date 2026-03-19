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

-- 6. CORRECTION DE LA VUE DES INTERVENTIONS PAR TECHNICIEN (SECURITY INVOKER)
DROP VIEW IF EXISTS public.vue_interventions_tech;
CREATE VIEW public.vue_interventions_tech 
WITH (security_invoker = true) 
AS
SELECT 
  i.*, 
  p.first_name || ' ' || p.last_name as tech_full_name
FROM public.interventions i
LEFT JOIN public.profiles p ON i.technician_id = p.id;

-- 7. CORRECTION DE LA VUE DES RÉACTIFS EN STOCK CRITIQUE (SECURITY INVOKER)
DROP VIEW IF EXISTS public.vue_reactifs_stock_critique;
CREATE VIEW public.vue_reactifs_stock_critique 
WITH (security_invoker = true) 
AS
SELECT * FROM public.lab_reagents 
WHERE current_stock <= min_stock;

-- 8. CORRECTION DE LA VUE DES ORDRES DE TRAVAIL EN RETARD (SECURITY INVOKER)
DROP VIEW IF EXISTS public.vue_work_orders_retard;
CREATE VIEW public.vue_work_orders_retard 
WITH (security_invoker = true) 
AS
SELECT * FROM public.work_orders 
WHERE due_date < CURRENT_DATE 
AND status != 'Completed';