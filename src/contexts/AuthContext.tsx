import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clé de stockage local pour le jeton factice
const FAKE_AUTH_KEY = 'dyad_fake_auth_token';

// Utilisateur factice pour le mode de contournement
const FAKE_USER: User = {
  id: 'fake-user-id-12345',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@dyad.sh',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Tenter d'obtenir la session Supabase normale
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
      } else {
        // 2. Vérifier le mode de contournement (Fake Auth)
        const fakeToken = localStorage.getItem(FAKE_AUTH_KEY);
        if (fakeToken) {
          // Si un jeton factice existe, simuler la connexion
          setSession({ access_token: fakeToken, token_type: 'Bearer', user: FAKE_USER, expires_in: 3600, expires_at: Date.now() / 1000 + 3600 } as Session);
          setUser(FAKE_USER);
          showSuccess("Mode Démo activé (Contournement Auth).");
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();

    // 3. Écouter les changements d'état Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Si l'utilisateur se déconnecte via Supabase, supprimer le jeton factice
      if (_event === 'SIGNED_OUT') {
        localStorage.removeItem(FAKE_AUTH_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Supprimer le jeton factice en plus de la déconnexion Supabase
    localStorage.removeItem(FAKE_AUTH_KEY);
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};