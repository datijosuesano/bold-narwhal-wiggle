"use client";

import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
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
  const isInitialized = useRef(false);

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
    return 'technician'; // Rôle par défaut sécurisé
  };

  useEffect(() => {
    // Éviter la double initialisation en mode StrictMode
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Si une erreur de session survient (ex: changement de projet), on nettoie
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setRole(null);
        } else {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            const userRole = await fetchRole(currentSession.user.id);
            setRole(userRole);
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      // On ignore l'événement INITIAL_SESSION s'il est déjà géré par getSession
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          const userRole = await fetchRole(currentSession.user.id);
          setRole(userRole);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      // Effacer le localStorage pour éviter les résidus d'ancienne session
      localStorage.removeItem('gmao-dyad-auth-token');
    } catch (e) {
      console.error("Sign out error:", e);
    } finally {
      window.location.href = '/login';
    }
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