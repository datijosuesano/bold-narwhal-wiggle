import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('user'); 
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (!error && profile?.role) {
        return profile.role as UserRole;
      }
    } catch (e) {
      console.error("Erreur récupération rôle:", e);
    }
    return 'user' as UserRole;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const userRole = await fetchRole(currentSession.user.id);
          setRole(userRole);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        const userRole = await fetchRole(currentSession.user.id);
        setRole(userRole);
      } else {
        setRole('user');
      }
      
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const hasRole = (roles: UserRole[]) => {
    if (role === 'admin') return true;
    return roles.includes(role);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground animate-pulse">Initialisation de la session...</p>
        </div>
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