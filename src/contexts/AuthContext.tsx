"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Chargement sécurisé du profil
   */
  const loadProfile = async (userId: string) => {
    try {
      console.log("Chargement profil :", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("role, specialite")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Erreur profile :", error);
        return {
          role: "user",
          specialty: null,
        };
      }

      console.log("Profil chargé :", data);

      return {
        role: data?.role ?? "user",
        specialty: data?.specialite ?? null,
      };
    } catch (err) {
      console.error("Crash profile :", err);

      return {
        role: "user",
        specialty: null,
      };
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("AUTH INIT START");

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Erreur session :", error);
        }

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await loadProfile(session.user.id);

          if (!mounted) return;

          setRole(profile.role);
          setSpecialty(profile.specialty);
        } else {
          setRole(null);
          setSpecialty(null);
        }
      } catch (err) {
        console.error("Erreur auth :", err);

        if (mounted) {
          setSession(null);
          setUser(null);
          setRole(null);
          setSpecialty(null);
        }
      } finally {
        if (mounted) {
          console.log("AUTH INIT END");
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      try {
        console.log("AUTH EVENT :", _event);

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const profile = await loadProfile(currentSession.user.id);

          if (!mounted) return;

          setRole(profile.role);
          setSpecialty(profile.specialty);
        } else {
          setRole(null);
          setSpecialty(null);
        }
      } catch (err) {
        console.error("Erreur auth state change :", err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setIsLoading(true);

      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erreur déconnexion :", err);
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

    // Normalisation simple (casse et espaces), mais conservation des underscores intacts
    const normalizedRole = role.toLowerCase().trim();

    // L'administrateur conserve un accès total partout
    if (normalizedRole === "admin") {
      return true;
    }

    // Comparaison stricte avec les chaînes exactes (ex: 'technicien_biomedical')
    return allowedRoles
      .map((r) => r.toLowerCase().trim())
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