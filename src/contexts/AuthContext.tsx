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
  const [specialty, setSessionSpecialty] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Chargement sécurisé du profil utilisateur
   */
  const loadProfile = async (userId: string) => {
    try {
      console.log("AuthContext - Chargement du profil pour l'ID :", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("role") // Extraction du rôle brut
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("AuthContext - Erreur de profil Supabase :", error.message);
        // Si erreur RLS ou réseau, on évite le crash et applique "user" (Collaborateur)
        return { role: "user", specialty: null };
      }

      console.log("AuthContext - Rôle chargé depuis la base de données :", data?.role);

      return {
        role: data?.role ?? "user",
        specialty: null, // Initialisé à null pour écarter tout conflit avec la colonne 'specialite'
      };
    } catch (err) {
      console.error("AuthContext - Crash critique lors du loadProfile :", err);
      return { role: "user", specialty: null };
    }
  };

  useEffect(() => {
    let active = true;

    // Déclaration d'une fonction asynchrone interne pour assurer le cycle complet, même en cas d'erreur
    const handleStateChange = async (event: string, currentSession: Session | null) => {
      try {
        if (!active) return;

        console.log("AuthContext - Changement d'état Auth :", event);

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const profile = await loadProfile(currentSession.user.id);
          if (active) {
            setRole(profile.role);
            setSessionSpecialty(profile.specialty);
          }
        } else {
          if (active) {
            setRole(null);
            setSessionSpecialty(null);
          }
        }
      } catch (error) {
        console.error("AuthContext - Erreur dans le traitement de onAuthStateChange :", error);
      } finally {
        // Cette section s'exécute QUOI QU'IL ARRIVE pour éviter que l'application reste figée sur isLoading: true
        if (active) {
          setIsLoading(false);
        }
      }
    };

    // Initialisation et écoute des sessions de Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      handleStateChange(event, currentSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Action de déconnexion globale
   */
  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
    } catch (err) {
      console.error("AuthContext - Erreur lors de la déconnexion :", err);
    } finally {
      setSession(null);
      setUser(null);
      setRole(null);
      setSessionSpecialty(null);
      setIsLoading(false);
      window.location.href = "/login";
    }
  };

  /**
   * Vérification stricte et nettoyage des rôles
   */
  const hasRole = (allowedRoles: string[]) => {
    if (!role) return false;

    // Normalisation basique (minuscules et nettoyage des espaces externes)
    // Nous conservons les underscores intacts ("technicien_biomedical")
    const normalizedRole = role.toLowerCase().trim();

    // L'administrateur contourne toutes les restrictions de menus
    if (normalizedRole === "admin") {
      return true;
    }

    // Comparaison avec le tableau fourni par la Sidebar
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