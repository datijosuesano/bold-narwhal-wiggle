-- ==========================================
-- 1. TYPES ÉNUMÉRÉS (ENUMS)
-- ==========================================
DO $$ BEGIN
    CREATE TYPE public.role_enum AS ENUM ('admin', 'technicien biomedical', 'gestionnaire de stock', 'secretaire', 'user', 'client');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.asset_status_enum AS ENUM ('Opérationnel', 'En panne', 'En maintenance', 'Réformé');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.priority_enum AS ENUM ('Faible', 'Moyenne', 'Élevée', 'Critique');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.maintenance_type_enum AS ENUM ('Préventive', 'Corrective', 'Curative', 'Palliative', 'Améliorative');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.work_order_status_enum AS ENUM ('Ouvert', 'En cours', 'En attente de pièce', 'Terminé', 'Annulé');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==========================================
-- 2. TABLES PRINCIPALES
-- ==========================================

-- PROFILS UTILISATEURS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  telephone TEXT,
  role public.role_enum DEFAULT 'user',
  specialite TEXT,
  site_name TEXT,
  status TEXT DEFAULT 'Disponible',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CLIENTS / SITES
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  contact_name TEXT,
  phone TEXT,
  contract_status TEXT DEFAULT 'None',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÉQUIPEMENTS (ASSETS)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  manufacturer TEXT,
  location TEXT, -- Nom du site client
  category TEXT DEFAULT 'autre',
  status public.asset_status_enum DEFAULT 'Opérationnel',
  description TEXT,
  image_url TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  commissioning_date DATE,
  manufacturing_date DATE,
  expiry_date DATE,
  purchase_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDRES DE TRAVAIL (WORK ORDERS)
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  asset_id UUID REFERENCES public.assets ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority public.priority_enum DEFAULT 'Moyenne',
  status public.work_order_status_enum DEFAULT 'Ouvert',
  maintenance_type public.maintenance_type_enum DEFAULT 'Préventive',
  due_date DATE,
  assigned_to UUID REFERENCES public.profiles(id),
  reporter_name TEXT, -- Pour le portail client
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INTERVENTIONS (HISTORIQUE RÉEL)
CREATE TABLE IF NOT EXISTS public.interventions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  asset_id UUID REFERENCES public.assets ON DELETE CASCADE,
  technician_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  maintenance_type public.maintenance_type_enum NOT NULL,
  intervention_date DATE DEFAULT CURRENT_DATE,
  parts_replaced BOOLEAN DEFAULT FALSE,
  invoice_number TEXT,
  invoice_status TEXT DEFAULT 'Non déposée',
  invoice_deposited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÉVÉNEMENTS DE PANNE (POUR FMD / PERFORMANCE)
CREATE TABLE IF NOT EXISTS public.breakdown_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  asset_id UUID REFERENCES public.assets ON DELETE CASCADE,
  breakdown_start TIMESTAMP WITH TIME ZONE NOT NULL,
  breakdown_end TIMESTAMP WITH TIME ZONE,
  repair_start TIMESTAMP WITH TIME ZONE,
  repair_end TIMESTAMP WITH TIME ZONE,
  is_planned_stop BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. SÉCURITÉ (RLS) - CRITIQUE POUR LE REFRESH
-- ==========================================

-- Activation RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakdown_events ENABLE ROW LEVEL SECURITY;

-- POLITIQUES PROFILS (Permet à l'app de charger l'utilisateur au refresh)
CREATE POLICY "Accès lecture profils authentifiés" ON public.profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Modification propre profil" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

-- POLITIQUES ASSETS (Lecture pour tous les connectés, modif pour staff)
CREATE POLICY "Lecture assets tous" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Modif assets staff" ON public.assets FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'technicien biomedical')));

-- POLITIQUES WORK ORDERS (Lecture tous, insertion pour portail/staff)
CREATE POLICY "Lecture OT tous" ON public.work_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insertion OT tous" ON public.work_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Modif OT staff" ON public.work_orders FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'technicien biomedical')));

-- ==========================================
-- 4. AUTOMATISATION (TRIGGERS)
-- ==========================================

-- Fonction de création automatique de profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, specialite, site_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    COALESCE((new.raw_user_meta_data ->> 'role')::public.role_enum, 'user'),
    new.raw_user_meta_data ->> 'specialite',
    new.raw_user_meta_data ->> 'site_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();