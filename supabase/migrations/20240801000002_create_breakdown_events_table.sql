-- Table pour enregistrer les événements de panne et les temps d'intervention précis
CREATE TABLE public.breakdown_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id TEXT NOT NULL, -- Utilisation de TEXT pour l'ID de l'actif mocké, à remplacer par UUID si la table assets est créée
  
  -- Temps d'arrêt (pour la Disponibilité)
  breakdown_start TIMESTAMP WITH TIME ZONE NOT NULL,
  breakdown_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Temps de réparation technique (pour le MTTR)
  repair_start TIMESTAMP WITH TIME ZONE,
  repair_end TIMESTAMP WITH TIME ZONE,
  
  description TEXT,
  is_planned_stop BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de RLS (OBLIGATOIRE)
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