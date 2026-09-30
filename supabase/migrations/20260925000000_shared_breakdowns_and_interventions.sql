-- Everyone on the staff team may read reported failures. Only administrators
-- can validate or route a reported failure into an operational work order.
-- Rebuild policies because PostgreSQL combines permissive policies with OR.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') $$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'technicien_biomedical', 'gestionnaire_stock', 'secretaire')) $$;

ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS technician_id uuid REFERENCES auth.users(id);
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS physical_rit_number text;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS diagnosis text;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS work_performed text;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS recommendations text;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS intervention_status text;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS intervention_place text;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS start_date timestamptz;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS end_date timestamptz;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS downtime_minutes integer DEFAULT 0;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS accessories_received text;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS parts_replaced boolean DEFAULT false;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS invoice_status text;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS invoice_deposited_at timestamptz;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS client_signature_url text;

DO $$
DECLARE policy_name text;
BEGIN
  FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'work_orders' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.work_orders', policy_name);
  END LOOP;
  FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'interventions' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.interventions', policy_name);
  END LOOP;
END $$;

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read all reported failures" ON public.work_orders
FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "staff create own work orders" ON public.work_orders
FOR INSERT TO authenticated WITH CHECK (public.is_staff() AND user_id = auth.uid());
CREATE POLICY "admin routes work orders and technicians update assigned work" ON public.work_orders
FOR UPDATE TO authenticated
USING (public.is_admin() OR assigned_to = auth.uid())
WITH CHECK (public.is_admin() OR assigned_to = auth.uid());
CREATE POLICY "admin deletes work orders" ON public.work_orders
FOR DELETE TO authenticated USING (public.is_admin());

ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read interventions" ON public.interventions
FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "staff create their interventions" ON public.interventions
FOR INSERT TO authenticated WITH CHECK (public.is_staff() AND (public.is_admin() OR user_id = auth.uid()));
CREATE POLICY "admin or assigned technician updates interventions" ON public.interventions
FOR UPDATE TO authenticated
USING (public.is_admin() OR technician_id = auth.uid() OR user_id = auth.uid())
WITH CHECK (public.is_admin() OR technician_id = auth.uid() OR user_id = auth.uid());
CREATE POLICY "admin deletes interventions" ON public.interventions
FOR DELETE TO authenticated USING (public.is_admin());
