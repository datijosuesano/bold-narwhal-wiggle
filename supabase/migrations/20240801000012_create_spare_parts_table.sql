-- Création de la table des pièces de rechange
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  reference TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 1,
  location TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation du RLS
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Users can see all spare parts" ON public.spare_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert spare parts" ON public.spare_parts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update spare parts" ON public.spare_parts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete spare parts" ON public.spare_parts FOR DELETE TO authenticated USING (true);