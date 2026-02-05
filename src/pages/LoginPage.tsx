import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { user, isLoading } = useAuth();

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
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;