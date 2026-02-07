-- Table des rapports (Reports)
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  report_type TEXT NOT NULL, -- Intervention, Mission
  client_name TEXT NOT NULL,
  technician_name TEXT NOT NULL,
  report_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft', -- Draft, Finalized
  content TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de RLS (OBLIGATOIRE)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can only see their own reports" ON public.reports
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own reports" ON public.reports
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own reports" ON public.reports
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own reports" ON public.reports
FOR DELETE TO authenticated USING (auth.uid() = user_id);