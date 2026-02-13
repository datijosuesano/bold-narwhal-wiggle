-- 1. Mise à jour de la structure de la table profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Available';

-- 2. Activation de la sécurité (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Création des politiques d'accès (Policies)
-- Permet à tout utilisateur connecté de voir les profils (pour les listes de techniciens)
DROP POLICY IF EXISTS "Tout le monde peut voir les profils" ON public.profiles;
CREATE POLICY "Tout le monde peut voir les profils" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- Permet aux utilisateurs connectés d'ajouter des profils
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des profils" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent créer des profils" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Permet aux utilisateurs connectés de modifier les profils
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier les profils" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent modifier les profils" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (true);

-- Permet aux utilisateurs connectés de supprimer des profils
DROP POLICY IF EXISTS "Les utilisateurs peuvent supprimer les profils" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent supprimer les profils" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (true);