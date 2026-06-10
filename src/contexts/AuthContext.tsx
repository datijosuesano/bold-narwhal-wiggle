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
      const { data, error } = await supabase
        .from("profiles")
        .select("role, specialite")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("AuthContext profiles fetch error:", error);
        return { role: "user", specialty: null };
      }

      return {
        role: data?.role ?? "user",
        specialty: data?.specialite ?? null,
      };
    } catch (err) {
      console.error("AuthContext fetchProfile crash:", err);
      return { role: "user", specialty: null };
    }
  };

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!active) return;

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          const profile = await fetchProfile(currentSession.user.id);
          if (active) {
            setRole(profile.role);
            setSpecialty(profile.specialty);
          }
        } else {
          setSession(null);
          setUser(null);
          setRole(null);
          setSpecialty(null);
        }
      } catch (err) {
        console.error("AuthContext initialization error:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!active) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession) {
        const profile = await fetchProfile(currentSession.user.id);
        if (active) {
          setRole(profile.role);
          setSpecialty(profile.specialty);
          setIsLoading(false);
        }
      } else {
        setRole(null);
        setSpecialty(null);
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