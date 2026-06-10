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

  const fetchProfile = async (userId: string) => {
    try {
      const { data: dbProfile, error } = await supabase
        .from("profiles")
        .select("role, specialite")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      const finalRole = dbProfile?.role ?? "user";
      const finalSpecialty = dbProfile?.specialite ?? null;

      return {
        role: finalRole,
        specialty: finalSpecialty,
      };

    } catch (error) {
      console.error("Erreur profile:", error);
      return {
        role: "user",
        specialty: null,
      };
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setSession(session);
        setUser(session.user);

        const profile = await fetchProfile(session.user.id);
        setRole(profile.role);
        setSpecialty(profile.specialty);
      }

      setIsLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (!session) {
          setRole(null);
          setSpecialty(null);
          setIsLoading(false);
          return;
        }

        const profile = await fetchProfile(session.user.id);
        setRole(profile.role);
        setSpecialty(profile.specialty);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const hasRole = (allowedRoles: string[]) => {
    if (!role) return false;

    const normalizedRole = role.toLowerCase().trim();

    // admin ALWAYS full access
    if (normalizedRole === "admin") return true;

    return allowedRoles
      .map(r => r.toLowerCase().trim())
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
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};