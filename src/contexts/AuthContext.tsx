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
      // Récupération des informations d'authentification utilisateur
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const meta = authUser?.user_metadata || {};

      // Récupération du profil en base de données
      const { data: dbProfile, error } = await supabase
        .from("profiles")
        .select("role, specialite, first_name, last_name")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      // Utiliser les métadonnées d'inscription comme fallback immédiat pour éviter d'attendre la synchro DB
      const finalSpecialty = dbProfile?.specialite || meta.specialite || "Biomédical";
      const finalFirstName = dbProfile?.first_name || meta.first_name || "";
      const finalLastName = dbProfile?.last_name || meta.last_name || "";
      
      let currentRole = dbProfile?.role || "user";
      let shouldUpdate = false;

      // Détermination rigoureuse du rôle selon la spécialité
      if (finalSpecialty === "Gestion Stock" && currentRole !== "gestionnaire de stock") {
        currentRole = "gestionnaire de stock";
        shouldUpdate = true;
      } else if (finalSpecialty === "Administratif" && currentRole !== "secretaire") {
        currentRole = "secretaire";
        shouldUpdate = true;
      } else if (
        ["Biomédical", "Imagerie", "Laboratoire", "Froid Médical"].includes(finalSpecialty) && 
        currentRole !== "technicien biomedical" && 
        currentRole !== "admin"
      ) {
        currentRole = "technicien biomedical";
        shouldUpdate = true;
      }

      // Mise à jour de sécurité de la base de données en arrière-plan
      if (
        shouldUpdate || 
        !dbProfile?.specialite || 
        !dbProfile?.first_name || 
        !dbProfile?.last_name
      ) {
        await supabase
          .from("profiles")
          .update({
            role: currentRole,
            specialite: finalSpecialty,
            first_name: finalFirstName,
            last_name: finalLastName
          })
          .eq("id", userId);
      }

      return {
        role: currentRole,
        specialty: finalSpecialty,
      };

    } catch (error) {
      console.error("Erreur récupération profil :", error);
      return {
        role: "user",
        specialty: null,
      };
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (session) {
          setSession(session);
          setUser(session.user);

          const profile = await fetchProfile(session.user.id);
          setRole(profile.role);
          setSpecialty(profile.specialty);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session) {
        setRole(null);
        setSpecialty(null);
        setIsLoading(false);
        return;
      }

      setTimeout(async () => {
        const profile = await fetchProfile(session.user.id);
        setRole(profile.role);
        setSpecialty(profile.specialty);
        setIsLoading(false);
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const hasRole = (roles: string[]) => {
    if (!role) return false;
    const userRole = role.toLowerCase();

    if (userRole === "admin" || userRole === "administrateur") {
      return true;
    }

    return roles
      .map((r) => r.toLowerCase())
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