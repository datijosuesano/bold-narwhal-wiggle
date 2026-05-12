-- 1. Ajout du champ pour le signalement des pannes via portail
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS reporter_name TEXT;

-- 2. Ajout du champ site_name pour les profils clients
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS site_name TEXT;

-- 3. Mise à jour de la fonction de création de profil pour inclure le site
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    chosen_specialty TEXT;
    chosen_site TEXT;
BEGIN
  chosen_specialty := COALESCE(NEW.raw_user_meta_data ->> 'specialite', 'Non défini');
  chosen_site := NEW.raw_user_meta_data ->> 'site_name';
  
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    role,
    specialite,
    site_name,
    status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user'), 
    chosen_specialty,
    chosen_site,
    'Disponible'
  );
  RETURN NEW;
END;
$function$;