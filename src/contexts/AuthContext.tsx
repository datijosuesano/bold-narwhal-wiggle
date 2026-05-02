"use client";

import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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

      if (!error && data) return data.role;
    } catch (e) {
      console.error("Erreur récupération rôle:", e);
    }
    return 'technician';
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          const userRole = await fetchRole(currentSession.user.id);
          setRole(userRole);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        // On libère le chargement quoi qu'il arrive pour laisser le router agir
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        const userRole = await fetchRole(currentSession.user.id);
        setRole(userRole);
      } else {
        setSession(null);
        setUser(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('gmao-dyad-auth-token');
    } catch (e) {
      console.error("Sign out error:", e);
    }
    // On ne fait pas de window.location.href ici pour éviter de casser le SPA
  };

  const hasRole = (roles: string[]) => {
    if (!role) return false;
    const userRole = role.toLowerCase();
    if (userRole === 'admin' || userRole === 'administrateur') return true;
    return roles.includes(role);
  };

  // CRITIQUE : On retourne toujours les enfants (children). 
  // C'est la ProtectedRoute qui décidera d'afficher un loader ou de rediriger.
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