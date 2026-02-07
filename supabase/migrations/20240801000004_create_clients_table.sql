-- Table des clients/sites (Clients)
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  contact_name TEXT,
  phone TEXT,
  contract_status TEXT DEFAULT 'None', -- Active, Expiring, None
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de RLS (OBLIGATOIRE)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can only see their own clients" ON public.clients
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own clients" ON public.clients
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own clients" ON public.clients
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own clients" ON public.clients
FOR DELETE TO authenticated USING (auth.uid() = user_id);