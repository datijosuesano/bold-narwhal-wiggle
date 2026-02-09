-- Table des Événements de Panne (pour calcul FMD)
CREATE TABLE public.breakdown_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  breakdown_start TIMESTAMP WITH TIME ZONE NOT NULL,
  breakdown_end TIMESTAMP WITH TIME ZONE,
  repair_start TIMESTAMP WITH TIME ZONE,
  repair_end TIMESTAMP WITH TIME ZONE,
  is_planned_stop BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (OBLIGATOIRE)
ALTER TABLE public.breakdown_events ENABLE ROW LEVEL SECURITY;

-- Policies RLS: Les utilisateurs ne peuvent voir/modifier que leurs propres événements
CREATE POLICY "Users can only see their own breakdown events" ON public.breakdown_events
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own breakdown events" ON public.breakdown_events
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own breakdown events" ON public.breakdown_events
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own breakdown events" ON public.breakdown_events
FOR DELETE TO authenticated USING (auth.uid() = user_id);