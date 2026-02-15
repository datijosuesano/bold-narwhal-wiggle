-- Enable RLS and add security policies for all tables

-- 1. profiles table
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE TO authenticated USING (auth.uid() = id);

-- 2. clients table
ALTER TABLE IF EXISTS public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_update_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON public.clients;

CREATE POLICY "clients_select_policy" ON public.clients
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "clients_insert_policy" ON public.clients
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_update_policy" ON public.clients
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "clients_delete_policy" ON public.clients
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. contracts table
ALTER TABLE IF EXISTS public.contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contracts_select_policy" ON public.contracts;
DROP POLICY IF EXISTS "contracts_insert_policy" ON public.contracts;
DROP POLICY IF EXISTS "contracts_update_policy" ON public.contracts;
DROP POLICY IF EXISTS "contracts_delete_policy" ON public.contracts;

CREATE POLICY "contracts_select_policy" ON public.contracts
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "contracts_insert_policy" ON public.contracts
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contracts_update_policy" ON public.contracts
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "contracts_delete_policy" ON public.contracts
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. reports table
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports_select_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_insert_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_update_policy" ON public.reports;
DROP POLICY IF EXISTS "reports_delete_policy" ON public.reports;

CREATE POLICY "reports_select_policy" ON public.reports
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "reports_insert_policy" ON public.reports
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reports_update_policy" ON public.reports
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "reports_delete_policy" ON public.reports
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. technician_profiles table (assuming this should be profil based on code)
ALTER TABLE IF EXISTS public.profil ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profil_select_policy" ON public.profil;
DROP POLICY IF EXISTS "profil_insert_policy" ON public.profil;
DROP POLICY IF EXISTS "profil_update_policy" ON public.profil;
DROP POLICY IF EXISTS "profil_delete_policy" ON public.profil;

CREATE POLICY "profil_select_policy" ON public.profil
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "profil_insert_policy" ON public.profil
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profil_update_policy" ON public.profil
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "profil_delete_policy" ON public.profil
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. lab_reagents table
ALTER TABLE IF EXISTS public.lab_reagents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_reagents_select_policy" ON public.lab_reagents;
DROP POLICY IF EXISTS "lab_reagents_insert_policy" ON public.lab_reagents;
DROP POLICY IF EXISTS "lab_reagents_update_policy" ON public.lab_reagents;
DROP POLICY IF EXISTS "lab_reagents_delete_policy" ON public.lab_reagents;

CREATE POLICY "lab_reagents_select_policy" ON public.lab_reagents
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "lab_reagents_insert_policy" ON public.lab_reagents
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lab_reagents_update_policy" ON public.lab_reagents
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "lab_reagents_delete_policy" ON public.lab_reagents
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. assets table
ALTER TABLE IF EXISTS public.assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assets_select_policy" ON public.assets;
DROP POLICY IF EXISTS "assets_insert_policy" ON public.assets;
DROP POLICY IF EXISTS "assets_update_policy" ON public.assets;
DROP POLICY IF EXISTS "assets_delete_policy" ON public.assets;

CREATE POLICY "assets_select_policy" ON public.assets
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "assets_insert_policy" ON public.assets
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assets_update_policy" ON public.assets
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "assets_delete_policy" ON public.assets
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. work_orders table
ALTER TABLE IF EXISTS public.work_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "work_orders_select_policy" ON public.work_orders;
DROP POLICY IF EXISTS "work_orders_insert_policy" ON public.work_orders;
DROP POLICY IF EXISTS "work_orders_update_policy" ON public.work_orders;
DROP POLICY IF EXISTS "work_orders_delete_policy" ON public.work_orders;

CREATE POLICY "work_orders_select_policy" ON public.work_orders
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "work_orders_insert_policy" ON public.work_orders
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "work_orders_update_policy" ON public.work_orders
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "work_orders_delete_policy" ON public.work_orders
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 9. tools table
ALTER TABLE IF EXISTS public.tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tools_select_policy" ON public.tools;
DROP POLICY IF EXISTS "tools_insert_policy" ON public.tools;
DROP POLICY IF EXISTS "tools_update_policy" ON public.tools;
DROP POLICY IF EXISTS "tools_delete_policy" ON public.tools;

CREATE POLICY "tools_select_policy" ON public.tools
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "tools_insert_policy" ON public.tools
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tools_update_policy" ON public.tools
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "tools_delete_policy" ON public.tools
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 10. invoices table
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_select_policy" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert_policy" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_policy" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete_policy" ON public.invoices;

CREATE POLICY "invoices_select_policy" ON public.invoices
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "invoices_insert_policy" ON public.invoices
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoices_update_policy" ON public.invoices
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "invoices_delete_policy" ON public.invoices
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 11. spare_parts table
ALTER TABLE IF EXISTS public.spare_parts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spare_parts_select_policy" ON public.spare_parts;
DROP POLICY IF EXISTS "spare_parts_insert_policy" ON public.spare_parts;
DROP POLICY IF EXISTS "spare_parts_update_policy" ON public.spare_parts;
DROP POLICY IF EXISTS "spare_parts_delete_policy" ON public.spare_parts;

CREATE POLICY "spare_parts_select_policy" ON public.spare_parts
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "spare_parts_insert_policy" ON public.spare_parts
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "spare_parts_update_policy" ON public.spare_parts
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "spare_parts_delete_policy" ON public.spare_parts
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 12. breakdown_events table
ALTER TABLE IF EXISTS public.breakdown_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "breakdown_events_select_policy" ON public.breakdown_events;
DROP POLICY IF EXISTS "breakdown_events_insert_policy" ON public.breakdown_events;
DROP POLICY IF EXISTS "breakdown_events_update_policy" ON public.breakdown_events;
DROP POLICY IF EXISTS "breakdown_events_delete_policy" ON public.breakdown_events;

CREATE POLICY "breakdown_events_select_policy" ON public.breakdown_events
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "breakdown_events_insert_policy" ON public.breakdown_events
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "breakdown_events_update_policy" ON public.breakdown_events
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "breakdown_events_delete_policy" ON public.breakdown_events
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 13. lab_reagent_movements table
ALTER TABLE IF EXISTS public.lab_reagent_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_reagent_movements_select_policy" ON public.lab_reagent_movements;
DROP POLICY IF EXISTS "lab_reagent_movements_insert_policy" ON public.lab_reagent_movements;
DROP POLICY IF EXISTS "lab_reagent_movements_update_policy" ON public.lab_reagent_movements;
DROP POLICY IF EXISTS "lab_reagent_movements_delete_policy" ON public.lab_reagent_movements;

CREATE POLICY "lab_reagent_movements_select_policy" ON public.lab_reagent_movements
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "lab_reagent_movements_insert_policy" ON public.lab_reagent_movements
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lab_reagent_movements_update_policy" ON public.lab_reagent_movements
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "lab_reagent_movements_delete_policy" ON public.lab_reagent_movements
FOR DELETE TO authenticated USING (auth.uid() = user_id);