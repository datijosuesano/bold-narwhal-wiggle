import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

type UserRole = string | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  signOut: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null); 
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (!error && data) {
        return data.role;
      }
    } catch (e) {
      console.error("Erreur récupération rôle:", e);
    }
    return 'user'; // Rôle par défaut
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
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
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const hasRole = (roles: string[]) => {
    if (!role) return false;
    const userRole = role.toLowerCase();
    if (userRole === 'admin' || userRole === 'administrateur') return true;
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