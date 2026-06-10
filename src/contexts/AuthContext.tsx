"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: string | null;
  specialty: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Supabase appelle immédiatement le callback onAuthStateChange avec la session courante au montage,
    // ce qui nous évite de devoir appeler getSession de manière concurrente.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!active) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("role, specialite")
            .eq("id", currentSession.user.id)
            .maybeSingle();

          if (error) {
            console.error("Erreur profil à l'authentification :", error);
          }

          if (active) {
            setRole(data?.role ?? "user");
            setSpecialty(data?.specialite ?? null);
          }
        } catch (err) {
          console.error("Crash récupération profil :", err);
          if (active) {
            setRole("user");
            setSpecialty(null);
          }
        }
      } else {
        if (active) {
          setRole(null);
          setSpecialty(null);
        }
      }

      // Désactive systématiquement le chargement une fois le flux initial traité
      if (active) {
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setSession(null);
      setUser(null);
      setRole(null);
      setSpecialty(null);
      setIsLoading(false);
      window.location.href = "/login";
    }
  };

  const hasRole = (allowedRoles: string[]) => {
    if (!role) return false;
    
    const userRole = role.toLowerCase().trim().replace(/_/g, ' ');
    if (userRole === "admin") return true;

    return allowedRoles
      .map((r) => r.toLowerCase().trim().replace(/_/g, ' '))
      .includes(userRole);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        role,
        specialty,
        isLoading,
        signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};