import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({ head: () => ({ meta: [{ title: "Ingia | SMART SOKO" }] }), component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { if (user) navigate({ to: "/checkout" }); }, [user, navigate]);
  if (user) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(null);
    try { await signIn(email.trim(), password); await refresh(); navigate({ to: "/checkout" }); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Email au password si sahihi."); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md items-center px-4 py-12">
      <form onSubmit={submit} className="w-full rounded-2xl border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-brand-foreground"><LogIn className="h-5 w-5" /></span><div><h1 className="font-display text-2xl font-bold">Ingia</h1><p className="text-sm text-muted-foreground">Endelea na oda yako.</p></div></div>
        <div className="space-y-4"><div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1" /></div><div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1" /></div></div>
        {message && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        <Button disabled={busy} className="mt-6 w-full bg-brand text-brand-foreground hover:bg-brand/90">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingia"}</Button>
        <p className="mt-5 text-center text-sm text-muted-foreground">Huna akaunti? <Link to="/register" className="font-semibold text-brand hover:underline">Jisajili</Link></p>
      </form>
    </div>
  );
}
