import { createClient } from '@supabase/supabase-js';

// Nouvelle URL de projet fournie
const SUPABASE_URL = "https://jsrzznvsynyvbonvvztz.supabase.co";

// Utilisation de la variable d'environnement pour la clé Publishable (Anon)
// Dans un projet Vite, nous utilisons import.meta.env
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Importez le client supabase comme ceci :
// import { supabase } from "@/integrations/supabase/client";
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);