import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Initialisation du client Supabase avec le Service Role Key
// Cela permet de créer des utilisateurs sans confirmation d'email et de définir leur rôle.
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Vérification de l'authentification de l'appelant (doit être un admin)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("[create-user] Unauthorized: Missing Authorization header");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Récupérer l'utilisateur appelant pour vérifier son rôle (doit être 'admin')
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callingUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !callingUser) {
        console.error("[create-user] Invalid token or user not found:", userError?.message);
        return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
            status: 401,
            headers: corsHeaders,
        });
    }

    // Récupérer le rôle de l'utilisateur appelant
    const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', callingUser.id)
        .single();

    if (profileError || profileData?.role !== 'admin') {
        console.error("[create-user] Caller is not an admin. Role:", profileData?.role);
        return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can create users' }), {
            status: 403,
            headers: corsHeaders,
        });
    }
    
    // 2. Traitement de la requête
    const { email, password, role, first_name, last_name } = await req.json();

    if (!email || !password || !role) {
      console.error("[create-user] Missing required fields: email, password, or role.");
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, role' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 3. Création de l'utilisateur via le Service Role Key
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirme l'email immédiatement
      user_metadata: {
        first_name,
        last_name,
      }
    });

    if (authError) {
      console.error("[create-user] Supabase Auth Error:", authError.message);
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 4. Mise à jour du rôle dans la table profiles (le trigger handle_new_user a déjà créé le profil)
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: role })
        .eq('id', newUser.user!.id);

    if (updateError) {
        console.error("[create-user] Profile Update Error:", updateError.message);
        // L'utilisateur est créé, mais le rôle n'est pas défini. On peut quand même retourner le succès.
    }

    console.log(`[create-user] User created successfully: ${email} with role ${role}`);

    return new Response(JSON.stringify({ 
        message: 'User created successfully', 
        userId: newUser.user!.id 
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error("[create-user] General error:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});