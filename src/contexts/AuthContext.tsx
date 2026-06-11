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

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, specialite")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Erreur de profil Supabase :", error.message);
        return { role: "user", specialty: null };
      }

      return {
        role: data?.role ?? "user",
        specialty: data?.specialite ?? null,
      };
    } catch (err) {
      console.error("Crash loadProfile :", err);
      return { role: "user", specialty: null };
    }
  };

  useEffect(() => {
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!active) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const profile = await loadProfile(currentSession.user.id);
        if (active) {
          setRole(profile.role);
          setSpecialty(profile.specialty);
        }
      } else {
        if (active) {
          setRole(null);
          setSpecialty(null);
        }
      }

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
    } catch (err) {
      console.error("Erreur de déconnexion :", err);
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

    const normalizedRole = role.toLowerCase().trim().replace(/_/g, ' ');
    if (normalizedRole === "admin") {
      return true;
    }

    return allowedRoles
      .map((r) => r.toLowerCase().trim().replace(/_/g, ' '))
      .includes(normalizedRole);
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
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};