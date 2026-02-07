-- Table des contrats (Contracts)
CREATE TABLE public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  provider TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, -- Lien vers la table clients
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  annual_cost NUMERIC,
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de RLS (OBLIGATOIRE)
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can only see their own contracts" ON public.contracts
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own contracts" ON public.contracts
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own contracts" ON public.contracts
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own contracts" ON public.contracts
FOR DELETE TO authenticated USING (auth.uid() = user_id);