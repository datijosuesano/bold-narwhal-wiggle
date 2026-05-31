```tsx
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

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {

      const { data, error } = await supabase
        .from("profiles")
        .select("role, specialite")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {

        let currentRole = data.role;
        let shouldUpdate = false;

        // ADMIN = intouchable
        if (data.role !== "admin") {

          // Administratif => Secrétaire
          if (
            data.specialite === "Administratif" &&
            data.role !== "secretaire"
          ) {
            currentRole = "secretaire";
            shouldUpdate = true;
          }

          // Gestion Stock => Gestionnaire
          else if (
            data.specialite === "Gestion Stock" &&
            data.role !== "gestionnaire de stock"
          ) {
            currentRole = "gestionnaire de stock";
            shouldUpdate = true;
          }

          // Métiers techniques
          else if (
            [
              "Biomédical",
              "Imagerie",
              "Laboratoire",
              "Froid Médical"
            ].includes(data.specialite || "") &&
            data.role !== "technicien biomedical"
          ) {
            currentRole = "technicien biomedical";
            shouldUpdate = true;
          }
        }

        // Mise à jour automatique si nécessaire
        if (shouldUpdate) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              role: currentRole
            })
            .eq("id", userId);

          if (updateError) {
            console.error(
              "Erreur mise à jour automatique du rôle :",
              updateError
            );
          }
        }

        return {
          role: currentRole,
          specialty: data.specialite || null,
        };
      }

      return {
        role: null,
        specialty: null,
      };

    } catch (error) {

      console.error(
        "Erreur récupération profil :",
        error
      );

      return {
        role: null,
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

          const profile = await fetchProfile(
            session.user.id
          );

          setRole(profile.role);
          setSpecialty(profile.specialty);
        }

      } catch (error) {

        console.error(
          "Erreur initialisation auth :",
          error
        );

      } finally {

        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {

        setSession(session);
        setUser(session?.user ?? null);

        if (!session) {

          setRole(null);
          setSpecialty(null);
          setIsLoading(false);
          return;
        }

        setTimeout(async () => {

          const profile = await fetchProfile(
            session.user.id
          );

          setRole(profile.role);
          setSpecialty(profile.specialty);
          setIsLoading(false);

        }, 0);
      }
    );

    return () => {
      subscription.unsubscribe();
    };

  }, []);

  const signOut = async () => {

    try {

      await supabase.auth.signOut();
      window.location.href = "/login";

    } catch (error) {

      console.error(
        "Erreur déconnexion :",
        error
      );
    }
  };

  const hasRole = (roles: string[]) => {

    if (!role) return false;

    const userRole = role.toLowerCase();

    // Admin a accès à tout
    if (
      userRole === "admin" ||
      userRole === "administrateur"
    ) {
      return true;
    }

    return roles
      .map(r => r.toLowerCase())
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

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};
```
