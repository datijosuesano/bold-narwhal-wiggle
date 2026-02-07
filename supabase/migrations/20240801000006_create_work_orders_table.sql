-- Table des ordres de travail (Work Orders)
CREATE TABLE public.work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  maintenance_type TEXT NOT NULL, -- Preventive, Corrective, Palliative, Ameliorative
  priority TEXT NOT NULL, -- Low, Medium, High
  asset_id TEXT, -- ID de l'actif concerné (TEXT pour l'instant, car la table assets utilise UUID)
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open', -- Open, InProgress, Completed, Cancelled
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de RLS (OBLIGATOIRE)
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can only see their own work orders" ON public.work_orders
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own work orders" ON public.work_orders
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own work orders" ON public.work_orders
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own work orders" ON public.work_orders
FOR DELETE TO authenticated USING (auth.uid() = user_id);