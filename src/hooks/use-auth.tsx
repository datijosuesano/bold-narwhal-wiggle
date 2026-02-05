import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

// Définition des rôles possibles
export type UserRole = 'admin' | 'technician' | 'stock_manager' | 'secretary' | 'user' | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchUserRole = async (userId: string): Promise<UserRole> => {
  // Assurez-vous que le rôle est récupéré correctement
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("[AuthContext] Error fetching user role:", error);
    // Si la récupération échoue (par exemple, si le profil n'a pas encore été créé par le trigger),
    // nous retournons 'user' par défaut.
    return 'user'; 
  }
  // Le rôle est casté en UserRole. Si data est null ou role est null, on utilise 'user'.
  return (data?.role as UserRole) || 'user';
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        // Attendre que le trigger Supabase ait potentiellement créé le profil
        // Nous ajoutons un petit délai pour donner le temps au trigger de s'exécuter après SIGNED_IN
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
             const userRole = await fetchUserRole(currentUser.id);
             setRole(userRole);
        }
      } else {
        setRole(null);
      }
      setIsLoading(false);
    });

    // Récupération de la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserRole(session.user.id).then(setRole);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Erreur lors de la déconnexion.");
      console.error("[AuthContext] Sign out error:", error);
    } else {
      setUser(null);
      setRole(null);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, role, isLoading, isAuthenticated, signOut }}>
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