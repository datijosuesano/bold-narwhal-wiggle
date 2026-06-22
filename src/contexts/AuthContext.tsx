"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_MAP } from "@/lib/roles"; // Ton dictionnaire de traduction

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Chargement sécurisé du profil utilisateur
   */
  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        console.error("AuthContext - Erreur lors du chargement du profil:", error?.message);
        return "client"; // Rôle par défaut sécurisé
      }

      // Vérification que le rôle existe dans notre ROLE_MAP (donc dans le role_enum)
      const isRoleValid = data.role in ROLE_MAP;
      return isRoleValid ? data.role : "client";

    } catch (err) {
      console.error("AuthContext - Crash critique loadProfile:", err);
      return "client";
    }
  };

  useEffect(() => {
    let active = true;

    const handleStateChange = async (event: string, currentSession: Session | null) => {
      try {
        if (!active) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const fetchedRole = await loadProfile(currentSession.user.id);
          if (active) setRole(fetchedRole);
        } else {
          if (active) setRole(null);
        }
      } catch (error) {
        console.error("AuthContext - Erreur onAuthStateChange :", error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      handleStateChange(event, currentSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setIsLoading(false);
    window.location.href = "/login";
  };

  const hasRole = (allowedRoles: string[]) => {
    if (!role) return false;
    // L'admin a accès à tout
    if (role === "admin") return true;
    // Vérification stricte contre la liste fournie
    return allowedRoles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        role,
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
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};