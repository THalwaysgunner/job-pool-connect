import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "admin" | "client" | "provider";

interface AuthContextType {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      console.log("Roles fetched:", data, "Error:", error);
      if (data) {
        setRoles(data.map((r: any) => r.role as AppRole));
      }
    } catch (e) {
      console.error("Failed to fetch roles:", e);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Manually set user and load roles after successful sign-in
    if (data.user) {
      setUser(data.user);
      await loadRoles(data.user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRoles([]);
  };

  useEffect(() => {
    let mounted = true;

    // Check initial session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          await loadRoles(session.user.id);
        }
      } catch (e) {
        console.error("getSession error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes (sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        if (!session?.user) {
          setUser(null);
          setRoles([]);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadRoles]);

  return (
    <AuthContext.Provider value={{ user, roles, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};