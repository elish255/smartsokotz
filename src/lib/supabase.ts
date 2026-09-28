export type SupabaseUser = {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: Record<string, unknown>;
};

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: SupabaseUser;
};

const STORAGE_KEY = "smart-soko-auth-session";
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfig = { url, key };

export function isSupabaseConfigured() { return Boolean(url && key); }

function assertConfigured() {
  if (!url || !key) throw new Error("Supabase haijawekwa. Weka VITE_SUPABASE_URL na VITE_SUPABASE_PUBLISHABLE_KEY kwenye Vercel.");
}

function saveSession(session: SupabaseSession | null) {
  if (typeof window === "undefined") return;
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

export function getStoredSession(): SupabaseSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as SupabaseSession : null;
  } catch { return null; }
}

async function authRequest(path: string, init: RequestInit = {}) {
  assertConfigured();
  const headers = new Headers(init.headers);
  headers.set("apikey", key!);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${url}/auth/v1/${path}`, { ...init, headers });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  if (!response.ok) throw new Error(data.msg || data.message || data.error_description || data.error || "Supabase authentication failed");
  return data;
}

export async function signUp(input: { email: string; password: string; fullName: string; phone: string }) {
  const data = await authRequest("signup", {
    method: "POST",
    body: JSON.stringify({ email: input.email, password: input.password, data: { full_name: input.fullName, phone: input.phone } }),
  });
  if (data.access_token) saveSession(data as SupabaseSession);
  return data as SupabaseSession & { user: SupabaseUser };
}

export async function signIn(email: string, password: string) {
  const data = await authRequest("token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  saveSession(data as SupabaseSession);
  return data as SupabaseSession;
}

export async function signOut() {
  const session = getStoredSession();
  if (session) {
    try {
      await authRequest("logout", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
    } catch {}
  }
  saveSession(null);
}

export async function refreshSession() {
  const session = getStoredSession();
  if (!session?.refresh_token) return null;
  try {
    const data = await authRequest("token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    saveSession(data as SupabaseSession);
    return data as SupabaseSession;
  } catch {
    saveSession(null);
    return null;
  }
}

export async function supabaseRest<T = any>(path: string, init: RequestInit = {}, accessToken?: string) {
  assertConfigured();
  const session = accessToken ? null : getStoredSession();
  const headers = new Headers(init.headers);
  headers.set("apikey", key!);
  headers.set("Content-Type", "application/json");
  headers.set("Prefer", headers.get("Prefer") || "return=representation");
  if (accessToken || session?.access_token) headers.set("Authorization", `Bearer ${accessToken || session!.access_token}`);
  const response = await fetch(`${url}/rest/v1/${path}`, { ...init, headers });
  const text = await response.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!response.ok) throw new Error(data.message || data.hint || data.details || "Supabase request failed");
  return data as T;
}
