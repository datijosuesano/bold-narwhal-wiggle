-- Création de la table interventions
CREATE TABLE IF NOT EXISTS public.interventions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  maintenance_type TEXT NOT NULL,
  intervention_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  parts_replaced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de la sécurité Row Level Security (RLS)
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Les utilisateurs authentifiés peuvent voir toutes les interventions" 
ON public.interventions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Les techniciens peuvent insérer leurs propres interventions" 
ON public.interventions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les techniciens peuvent modifier leurs propres interventions" 
ON public.interventions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Seuls les admins peuvent supprimer des interventions" 
ON public.interventions FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);