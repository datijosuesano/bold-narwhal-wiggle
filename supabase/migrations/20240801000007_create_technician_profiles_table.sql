-- Table des profils de techniciens (Technician Profiles)
CREATE TABLE public.technician_profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  specialty TEXT NOT NULL,
  phone TEXT,
  
  -- Note: name and email are usually retrieved from auth.users or public.profiles
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de RLS (OBLIGATOIRE)
ALTER TABLE public.technician_profiles ENABLE ROW LEVEL SECURITY;

-- Policies RLS
-- Les techniciens peuvent voir leur propre profil
CREATE POLICY "Technicians can view their own profile" ON public.technician_profiles
FOR SELECT TO authenticated USING (auth.uid() = id);

-- Les administrateurs (ou l'utilisateur lui-même) peuvent mettre à jour
CREATE POLICY "Users can update their own technician profile" ON public.technician_profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

-- L'insertion sera gérée par l'admin ou un trigger si nécessaire, mais nous laissons la politique de base
CREATE POLICY "Authenticated users can insert their technician profile" ON public.technician_profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own technician profile" ON public.technician_profiles
FOR DELETE TO authenticated USING (auth.uid() = id);