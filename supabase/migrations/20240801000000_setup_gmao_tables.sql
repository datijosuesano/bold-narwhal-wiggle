-- 1. Table des Clients
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

-- 3. Table des Ordres de Travail
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  maintenance_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des Réactifs
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

-- 5. Table des Rapports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  client TEXT NOT NULL,
  technician TEXT NOT NULL,
  content TEXT,
  date DATE NOT NULL,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table des Contrats
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
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de la sécurité (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reagents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Manage own clients" ON public.clients FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage own assets" ON public.assets FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage own work_orders" ON public.work_orders FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage own reagents" ON public.lab_reagents FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage own reports" ON public.reports FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage own contracts" ON public.contracts FOR ALL TO authenticated USING (auth.uid() = user_id);