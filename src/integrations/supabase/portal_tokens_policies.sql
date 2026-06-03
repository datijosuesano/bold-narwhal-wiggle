-- 1. S'assurer que la sécurité RLS est bien activée sur la table des tokens
ALTER TABLE public.portal_access_tokens ENABLE ROW LEVEL SECURITY;

-- 2. Accorder les privilèges d'API aux rôles anonymes et authentifiés
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.portal_access_tokens TO authenticated;
GRANT SELECT ON TABLE public.portal_access_tokens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.portal_access_tokens TO service_role;

-- 3. Supprimer d'anciennes politiques existantes pour éviter les doublons
DROP POLICY IF EXISTS "Allow public select on portal_access_tokens" ON public.portal_access_tokens;
DROP POLICY IF EXISTS "Allow authenticated insert on portal_access_tokens" ON public.portal_access_tokens;
DROP POLICY IF EXISTS "Allow authenticated update on portal_access_tokens" ON public.portal_access_tokens;

-- 4. Politique de LECTURE (SELECT) : Tout le monde (y compris les clients externes scannant le QR code) doit pouvoir lire le token
CREATE POLICY "Allow public select on portal_access_tokens" 
ON public.portal_access_tokens 
FOR SELECT 
USING (true);

-- 5. Politique de CRÉATION (INSERT) : Seuls les utilisateurs connectés (membres du staff) peuvent générer des tokens
CREATE POLICY "Allow authenticated insert on portal_access_tokens" 
ON public.portal_access_tokens 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 6. Politique de MODIFICATION (UPDATE) : Seuls les utilisateurs connectés peuvent activer/désactiver un token
CREATE POLICY "Allow authenticated update on portal_access_tokens" 
ON public.portal_access_tokens 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);