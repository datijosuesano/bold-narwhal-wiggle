-- 1. Enable Row Level Security on all critical tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakdown_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reagents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reagent_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing permissive policies (those using 'true' or missing user checks)
-- Assets
DROP POLICY IF EXISTS "lecture_globale_assets" ON public.assets;
DROP POLICY IF EXISTS "Action totale assets" ON public.assets;
DROP POLICY IF EXISTS "lecture_assets" ON public.assets;
DROP POLICY IF EXISTS "Assets_Select" ON public.assets;
DROP POLICY IF EXISTS "Lecture globale assets" ON public.assets;
DROP POLICY IF EXISTS "Lire équipements" ON public.assets;
DROP POLICY IF EXISTS "Users can view their own assets" ON public.assets;

-- Clients
DROP POLICY IF EXISTS "lecture_globale_clients" ON public.clients;
DROP POLICY IF EXISTS "Action totale clients" ON public.clients;
DROP POLICY IF EXISTS "Lecture globale clients" ON public.clients;

-- Work Orders
DROP POLICY IF EXISTS "lecture_globale_work_orders" ON public.work_orders;
DROP POLICY IF EXISTS "Allow_All_WO" ON public.work_orders;
DROP POLICY IF EXISTS "lecture_work_orders" ON public.work_orders;

-- Interventions
DROP POLICY IF EXISTS "lecture_globale_interventions" ON public.interventions;
DROP POLICY IF EXISTS "lecture_interventions" ON public.interventions;

-- Documents & Attachments
DROP POLICY IF EXISTS "Docs_select_policy" ON public.asset_documents;
DROP POLICY IF EXISTS "tout_le_monde_ajoute" ON public.asset_documents;
DROP POLICY IF EXISTS "tout_le_monde_supprime" ON public.asset_documents;
DROP POLICY IF EXISTS "tout_le_monde_voit" ON public.asset_documents;
DROP POLICY IF EXISTS "lecture_documents" ON public.asset_documents;
DROP POLICY IF EXISTS "Docs_Select" ON public.asset_documents;
DROP POLICY IF EXISTS "lecture_attachments" ON public.intervention_attachments;

-- Stock & Tools
DROP POLICY IF EXISTS "Accès mouvements authentifiés" ON public.lab_reagent_movements;
DROP POLICY IF EXISTS "Lecture_Mouvements_Auth" ON public.lab_reagent_movements;
DROP POLICY IF EXISTS "Accès pièces authentifiées" ON public.spare_parts;
DROP POLICY IF EXISTS "Lecture_SpareParts_Auth" ON public.spare_parts;
DROP POLICY IF EXISTS "Accès outils authentifiés" ON public.tools;

-- Breakdown Events
DROP POLICY IF EXISTS "Allow all authenticated users to read breakdown_events" ON public.breakdown_events;
DROP POLICY IF EXISTS "Allow all authenticated users to insert breakdown_events" ON public.breakdown_events;
DROP POLICY IF EXISTS "Allow all authenticated users to update breakdown_events" ON public.breakdown_events;
DROP POLICY IF EXISTS "Allow all authenticated users to delete breakdown_events" ON public.breakdown_events;
DROP POLICY IF EXISTS "Allow Select for All" ON public.breakdown_events;

-- Profiles
DROP POLICY IF EXISTS "Profiles_Select" ON public.profiles;

-- 3. Create restrictive policies (Owner-only access)
-- Profiles: Users can only see and update their own profile
CREATE POLICY "profiles_owner_policy" ON public.profiles
FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Assets: Users can only access their own assets
CREATE POLICY "assets_owner_policy" ON public.assets
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Clients
CREATE POLICY "clients_owner_policy" ON public.clients
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Work Orders
CREATE POLICY "work_orders_owner_policy" ON public.work_orders
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Contracts
CREATE POLICY "contracts_owner_policy" ON public.contracts
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Breakdown Events
CREATE POLICY "breakdown_events_owner_policy" ON public.breakdown_events
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lab Reagents
CREATE POLICY "lab_reagents_owner_policy" ON public.lab_reagents
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lab Reagent Movements
CREATE POLICY "lab_reagent_movements_owner_policy" ON public.lab_reagent_movements
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Spare Parts
CREATE POLICY "spare_parts_owner_policy" ON public.spare_parts
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tools
CREATE POLICY "tools_owner_policy" ON public.tools
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Interventions
CREATE POLICY "interventions_owner_policy" ON public.interventions
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Intervention Attachments
CREATE POLICY "intervention_attachments_owner_policy" ON public.intervention_attachments
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Asset Documents
CREATE POLICY "asset_documents_owner_policy" ON public.asset_documents
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reports
CREATE POLICY "reports_owner_policy" ON public.reports
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);