-- Table des équipements (Assets)
CREATE TABLE public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  category TEXT,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Opérationnel', -- Opérationnel, Maintenance, En Panne
  serial_number TEXT UNIQUE NOT NULL,
  model TEXT,
  manufacturer TEXT,
  commissioning_date DATE,
  purchase_cost NUMERIC,
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de RLS (OBLIGATOIRE)
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can only see their own assets" ON public.assets
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own assets" ON public.assets
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own assets" ON public.assets
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own assets" ON public.assets
FOR DELETE TO authenticated USING (auth.uid() = user_id);