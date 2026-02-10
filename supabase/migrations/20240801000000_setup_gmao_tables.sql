-- SCRIPT D'INITIALISATION COMPLET --

-- Tables de base
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Activation RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_reagents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (Sécurité)
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can manage their own clients" ON public.clients FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own assets" ON public.assets FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own work orders" ON public.work_orders FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own reagents" ON public.lab_reagents FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own reports" ON public.reports FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own contracts" ON public.contracts FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Fonction de création auto de profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();