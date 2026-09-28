import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SupabaseSession, SupabaseUser } from "@/lib/supabase";
import { getStoredSession, refreshSession, signOut as supabaseSignOut } from "@/lib/supabase";

interface AuthContextValue {
  user: SupabaseUser | null;
  session: SupabaseSession | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({ user: null, session: null, loading: true, signOut: async () => {}, refresh: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const current = getStoredSession();
    if (!current) { setSession(null); setLoading(false); return; }
    const now = Math.floor(Date.now() / 1000);
    if (current.expires_at && current.expires_at < now + 60) {
      const renewed = await refreshSession();
      setSession(renewed);
    } else setSession(current);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const value = useMemo(() => ({
    user: session?.user ?? null,
    session,
    loading,
    signOut: async () => { await supabaseSignOut(); setSession(null); },
    refresh,
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
