-- Table pour la gestion des réactifs de laboratoire
CREATE TABLE public.lab_reagents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL, -- Ex: ml, g, flacon
  supplier TEXT,
  purchase_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE public.lab_reagents ENABLE ROW LEVEL SECURITY;

-- Policies RLS pour l'accès utilisateur
CREATE POLICY "Users can only see their own reagents" ON public.lab_reagents
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own reagents" ON public.lab_reagents
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own reagents" ON public.lab_reagents
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own reagents" ON public.lab_reagents
FOR DELETE TO authenticated USING (auth.uid() = user_id);