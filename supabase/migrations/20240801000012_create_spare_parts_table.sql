-- Création de la table des pièces de rechange
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  reference TEXT NOT NULL,
  current_stock INT DEFAULT 0,
  min_stock INT DEFAULT 1,
  location TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de la sécurité
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

-- Politiques
CREATE POLICY "Acces lecture authentifié" ON public.spare_parts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Acces insertion authentifié" ON public.spare_parts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Acces mise à jour authentifié" ON public.spare_parts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Acces suppression authentifié" ON public.spare_parts FOR DELETE TO authenticated USING (true);