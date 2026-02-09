-- Table des Ordres de Travail (Work Orders)
CREATE TABLE public.work_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  maintenance_type TEXT NOT NULL, -- 'Preventive', 'Corrective', 'Palliative', 'Ameliorative'
  priority TEXT DEFAULT 'Medium' NOT NULL, -- 'Low', 'Medium', 'High'
  status TEXT DEFAULT 'Open' NOT NULL, -- 'Open', 'InProgress', 'Completed', 'Cancelled'
  due_date DATE NOT NULL,
  assigned_to UUID REFERENCES auth.users(id), -- Peut être null si non assigné
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (OBLIGATOIRE)
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- Policies RLS: Les utilisateurs ne peuvent voir/modifier que leurs propres OT
CREATE POLICY "Users can only see their own work orders" ON public.work_orders
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own work orders" ON public.work_orders
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own work orders" ON public.work_orders
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own work orders" ON public.work_orders
FOR DELETE TO authenticated USING (auth.uid() = user_id);