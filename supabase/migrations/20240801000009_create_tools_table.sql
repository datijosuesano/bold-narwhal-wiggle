-- Create tools table
CREATE TABLE public.tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  serial_number TEXT,
  category TEXT DEFAULT 'Outillage',
  status TEXT DEFAULT 'Disponible', -- 'Disponible', 'Attribué', 'En Réparation'
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- Owner who created the entry
);

-- Enable RLS
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can see all tools" ON public.tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert tools" ON public.tools FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update tools" ON public.tools FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete tools" ON public.tools FOR DELETE TO authenticated USING (auth.uid() = user_id);