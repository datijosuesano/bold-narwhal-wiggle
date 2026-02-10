-- 0. Table des profils utilisateurs pour stocker les informations complémentaires
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Table des Clients (Établissements / Sites)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  contact_name TEXT,
  phone TEXT,
  contract_status TEXT DEFAULT 'None',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Équipements (Assets)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Non classé',
  location TEXT,
  status TEXT DEFAULT 'Opérationnel',
  serial_number TEXT,
  model TEXT,
  manufacturer TEXT,
  commissioning_date DATE,
  purchase_cost NUMERIC DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des Ordres de Travail (Work Orders)
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  maintenance_type TEXT NOT NULL, -- Preventive, Corrective, etc.
  priority TEXT NOT NULL, -- Low, Medium, High
  due_date DATE,
  status TEXT DEFAULT 'Open', -- Open, InProgress, Completed, Cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des Réactifs de Laboratoire
CREATE TABLE IF NOT EXISTS public.lab_reagents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  reference TEXT NOT NULL,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 1,
  unit TEXT NOT NULL,
  supplier TEXT,
  purchase_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des Rapports d'Activité
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- Intervention, Mission
  client TEXT NOT NULL,
  technician TEXT NOT NULL,
  content TEXT,
  date DATE NOT NULL,
  status TEXT DEFAULT 'Draft', -- Draft, Finalized
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table des Contrats de Maintenance
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  clinic TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  annual_cost NUMERIC DEFAULT 0,
  description TEXT,
  status TEXT DEFAULT 'Active', -- Active, Expired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table des Événements de Panne (Calculs FMD : MTTR, MTBF)
CREATE TABLE IF NOT EXISTS public.breakdown_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  breakdown_start TIMESTAMP WITH TIME ZONE NOT NULL,
  breakdown_end TIMESTAMP WITH TIME ZONE,
  repair_start TIMESTAMP WITH TIME ZONE,
  repair_end TIMESTAMP WITH TIME ZONE,
  is_planned_stop BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ACTIVATION DE LA SÉCURITÉ (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reagents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakdown_events ENABLE ROW LEVEL SECURITY;

-- POLITIQUES DE SÉCURITÉ (Un utilisateur ne peut voir/modifier que ses données)
CREATE POLICY "Manage own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "Manage own clients" ON public.clients FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage own assets" ON public.assets FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage own work_orders" ON public.work_orders FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage own reagents" ON public.lab_reagents FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage own reports" ON public.reports FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage own contracts" ON public.contracts FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Pour les pannes, accès via l'équipement appartenant à l'utilisateur
CREATE POLICY "Manage breakdown events for own assets" ON public.breakdown_events FOR ALL TO authenticated 
USING (asset_id IN (SELECT id FROM public.assets WHERE user_id = auth.uid()));

-- TRIGGER POUR CRÉATION AUTOMATIQUE DE PROFIL AU SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();