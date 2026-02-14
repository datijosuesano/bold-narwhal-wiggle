import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';

type UserRole = 'admin' | 'technician' | 'stock_manager' | 'secretary' | 'user';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  signOut: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FAKE_AUTH_KEY = 'dyad_fake_auth_token';

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
  const [role, setRole] = useState<UserRole>('user');
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profil')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        setRole(data.role as UserRole);
      } else {
        // Fallback for demo/new users
        setRole('admin'); 
      }
    } catch (e) {
      setRole('user');
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        await fetchUserRole(initialSession.user.id);
      } else {
        const fakeToken = localStorage.getItem(FAKE_AUTH_KEY);
        if (fakeToken) {
          setSession({ access_token: fakeToken, user: FAKE_USER } as any);
          setUser(FAKE_USER);
          setRole('admin'); // Démo est admin par défaut
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserRole(session.user.id);
      }
      setIsLoading(false);
      if (_event === 'SIGNED_OUT') localStorage.removeItem(FAKE_AUTH_KEY);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem(FAKE_AUTH_KEY);
    await supabase.auth.signOut();
  };

  const hasRole = (roles: UserRole[]) => {
    return roles.includes(role);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, role, isLoading, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};