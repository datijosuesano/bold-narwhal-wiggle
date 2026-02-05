import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Navigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-lg">Chargement de l'authentification...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-card rounded-2xl shadow-2xl border border-border/50">
        <h1 className="text-3xl font-extrabold text-center text-primary">
          Connexion GMAO
        </h1>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(217.2 91.2% 59.8%)', // Blue-600
                  brandAccent: 'hsl(217.2 91.2% 50%)',
                },
                radii: {
                    borderRadiusButton: '0.75rem', // rounded-xl
                    inputBorderRadius: '0.75rem', // rounded-xl
                }
              },
            },
          }}
          theme="light"
          redirectTo={window.location.origin + '/'}
        />
      </div>
    </div>
  );
};

export default LoginPage;