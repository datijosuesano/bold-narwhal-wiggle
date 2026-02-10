import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/utils/toast';

const DEMO_EMAIL = "demo@dyad.sh";
const DEMO_PASSWORD = "dyad-demo-123";
const FAKE_AUTH_KEY = 'dyad_fake_auth_token'; // Importé du contexte

const LoginPage: React.FC = () => {
  const { user, isLoading } = useAuth();

  const handleDemoLogin = async () => {
    // 1. Tenter la connexion Supabase normale
    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });

    if (error) {
      console.error("Demo login failed (Supabase error):", error);
      showError(`Échec de la connexion Supabase: ${error.message}. Activation du mode Démo.`);
      
      // 2. Activer le mode de contournement (Fake Auth)
      // Nous stockons un jeton factice pour que AuthProvider simule la connexion
      localStorage.setItem(FAKE_AUTH_KEY, 'fake-jwt-token-for-dyad-demo');
      
      // Forcer un rafraîchissement pour que AuthProvider détecte le jeton factice
      window.location.reload(); 

    } else {
      showSuccess("Connexion de démonstration réussie !");
    }
  };

  if (isLoading) {
    return null; // Wait for AuthProvider to finish loading
  }

  if (user) {
    // If user is already logged in, redirect to dashboard
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-2xl border-t-4 border-blue-600">
        <CardHeader className="text-center space-y-2">
          <Building2 className="h-10 w-10 text-blue-600 mx-auto" />
          <CardTitle className="text-3xl font-extrabold text-primary">
            Connexion GMAO
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Connectez-vous pour accéder à la plateforme de gestion de maintenance.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="light"
            providers={[]}
            redirectTo={window.location.origin}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Mot de passe',
                  email_input_placeholder: 'Votre email professionnel',
                  password_input_placeholder: 'Votre mot de passe',
                  button_label: 'Se connecter',
                  social_provider_text: 'Se connecter avec {{provider}}',
                  link_text: 'Déjà un compte ? Connectez-vous',
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Mot de passe',
                  email_input_placeholder: 'Votre email professionnel',
                  password_input_placeholder: 'Créer un mot de passe',
                  button_label: 'Créer un compte',
                  link_text: 'Pas encore de compte ? Inscrivez-vous',
                },
                forgotten_password: {
                  link_text: 'Mot de passe oublié ?',
                },
              },
            }}
          />
          
          <div className="mt-6 pt-4 border-t">
            <Button 
              onClick={handleDemoLogin} 
              className="w-full bg-green-600 hover:bg-green-700 rounded-xl shadow-md"
            >
              <LogIn className="mr-2 h-4 w-4" /> Connexion Démo (demo@dyad.sh)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;