-- Table des équipements (Assets)
CREATE TABLE public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Non classé' NOT NULL,
  location TEXT NOT NULL,
  status TEXT DEFAULT 'Opérationnel' NOT NULL, -- 'Opérationnel', 'Maintenance', 'En Panne'
  serial_number TEXT UNIQUE,
  model TEXT,
  manufacturer TEXT,
  commissioning_date DATE,
  purchase_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (OBLIGATOIRE)
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Policies RLS: Les utilisateurs ne peuvent voir/modifier que leurs propres équipements
CREATE POLICY "Users can only see their own assets" ON public.assets
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own assets" ON public.assets
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own assets" ON public.assets
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own assets" ON public.assets
FOR DELETE TO authenticated USING (auth.uid() = user_id);