-- Création de la table des événements de panne
CREATE TABLE IF NOT EXISTS public.breakdown_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  breakdown_start TIMESTAMP WITH TIME ZONE NOT NULL,
  breakdown_end TIMESTAMP WITH TIME ZONE,
  repair_start TIMESTAMP WITH TIME ZONE,
  repair_end TIMESTAMP WITH TIME ZONE,
  is_planned_stop BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation RLS
ALTER TABLE public.breakdown_events ENABLE ROW LEVEL SECURITY;

-- Politique de sécurité
CREATE POLICY "Manage own breakdown events" ON public.breakdown_events 
FOR ALL TO authenticated USING (auth.uid() = user_id);