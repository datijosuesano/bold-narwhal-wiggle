-- Table des Réactifs de Laboratoire
CREATE TABLE public.lab_reagents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  current_stock INTEGER DEFAULT 0 NOT NULL,
  min_stock INTEGER DEFAULT 1 NOT NULL,
  unit TEXT NOT NULL,
  supplier TEXT,
  purchase_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (OBLIGATOIRE)
ALTER TABLE public.lab_reagents ENABLE ROW LEVEL SECURITY;

-- Policies RLS: Les utilisateurs ne peuvent voir/modifier que leurs propres réactifs
CREATE POLICY "Users can only see their own reagents" ON public.lab_reagents
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own reagents" ON public.lab_reagents
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own reagents" ON public.lab_reagents
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own reagents" ON public.lab_reagents
FOR DELETE TO authenticated USING (auth.uid() = user_id);