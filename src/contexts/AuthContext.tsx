"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
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

  // Fonction de récupération du rôle avec sécurité
  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle(); // maybeSingle évite une erreur si le profil n'existe pas encore

      if (error) throw error;
      return data?.role || 'user';
    } catch (e) {
      console.error("Erreur récupération rôle:", e);
      return 'user'; // Retourne un rôle par défaut en cas d'erreur
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          const userRole = await fetchRole(currentSession.user.id);
          setRole(userRole);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        // CRITIQUE : Toujours passer à false pour libérer l'application
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
      // Redirection propre
      window.location.href = '/login';
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  const hasRole = (roles: string[]) => {
    if (!role) return false;
    const userRole = role.toLowerCase();
    // Un admin a accès à tout par défaut
    if (userRole === 'admin' || userRole === 'administrateur') return true;
    return roles.map(r => r.toLowerCase()).includes(userRole);
  };

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