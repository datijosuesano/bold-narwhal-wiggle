-- Mise à jour ou création de la table interventions
CREATE TABLE IF NOT EXISTS public.interventions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  work_details TEXT NOT NULL, -- Détails des travaux
  maintenance_type TEXT NOT NULL,
  intervention_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER DEFAULT 0, -- Durée
  total_cost NUMERIC DEFAULT 0, -- Coût total
  parts_cost NUMERIC DEFAULT 0, -- Coût des pièces
  parts_replaced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation RLS
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- Politiques
CREATE POLICY "interventions_select_policy" ON public.interventions FOR SELECT TO authenticated USING (true);
CREATE POLICY "interventions_insert_policy" ON public.interventions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "interventions_update_policy" ON public.interventions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "interventions_delete_policy" ON public.interventions FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);