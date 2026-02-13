-- 1. Suppression et re-création propre de la table sans contrainte stricte sur user_id
DROP TABLE IF EXISTS public.spare_parts CASCADE;

CREATE TABLE public.spare_parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- On retire la référence forcée à auth.users pour le mode démo
  name TEXT NOT NULL,
  reference TEXT NOT NULL,
  current_stock INT DEFAULT 0,
  min_stock INT DEFAULT 1,
  location TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Activation du RLS
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

-- 3. Politiques permissives pour le développement
DROP POLICY IF EXISTS "Permettre tout aux connectés" ON public.spare_parts;
CREATE POLICY "Permettre tout aux connectés" 
ON public.spare_parts FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);