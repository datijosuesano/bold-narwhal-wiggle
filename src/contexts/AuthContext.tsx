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

  /**
   * SAFE PROFILE FETCH (ne peut jamais bloquer l'app)
   */
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, specialite")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Profile error:", error);
        return { role: "user", specialty: null };
      }

      return {
        role: data?.role ?? "user",
        specialty: data?.specialite ?? null,
      };

    } catch (e) {
      console.error("fetchProfile crash:", e);
      return { role: "user", specialty: null };
    }
  };

  /**
   * INITIALISATION AUTH (100% SAFE)
   */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Session error:", error);
          setIsLoading(false);
          return;
        }

        const session = data.session;

        if (!session) {
          setSession(null);
          setUser(null);
          setRole(null);
          setSpecialty(null);
          setIsLoading(false);
          return;
        }

        setSession(session);
        setUser(session.user);

        const profile = await fetchProfile(session.user.id);

        if (!mounted) return;

        setRole(profile.role);
        setSpecialty(profile.specialty);

      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {
        try {
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

        } catch (e) {
          console.error("Auth change error:", e);
          setRole("user");
        } finally {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * SIGN OUT SAFE
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("SignOut error:", error);
    }
  };

  /**
   * ROLE CHECK (simple et fiable)
   */
  const hasRole = (allowedRoles: string[]) => {
    if (!role) return false;

    const normalized = role.toLowerCase().trim();

    if (normalized === "admin") return true;

    return allowedRoles
      .map(r => r.toLowerCase().trim())
      .includes(normalized);
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