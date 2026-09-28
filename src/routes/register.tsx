import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Jisajili | SMART SOKO" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { if (user) navigate({ to: "/checkout" }); }, [user, navigate]);
  if (user) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (password.length < 6) { setMessage("Password iwe na angalau herufi 6."); return; }
    setBusy(true);
    try {
      const data = await signUp({ fullName: fullName.trim(), phone: phone.trim(), email: email.trim(), password });
      if (data.access_token) {
        toast.success("Akaunti imefunguliwa");
        navigate({ to: "/checkout" });
      } else {
        setMessage("Akaunti imeundwa. Angalia email yako kuthibitisha akaunti, kisha ingia.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Imeshindikana kujisajili.");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md items-center px-4 py-12">
      <form onSubmit={submit} className="w-full rounded-2xl border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-brand-foreground"><UserPlus className="h-5 w-5" /></span>
          <div><h1 className="font-display text-2xl font-bold">Jisajili SMART SOKO</h1><p className="text-sm text-muted-foreground">Fungua akaunti ili uendelee na oda yako.</p></div>
        </div>
        <div className="space-y-4">
          <div><Label htmlFor="fullName">Majina kamili</Label><Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1" /></div>
          <div><Label htmlFor="phone">Namba ya simu</Label><Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1" placeholder="0712345678" /></div>
          <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1" /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1" /></div>
        </div>
        {message && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}
        <Button disabled={busy} className="mt-6 w-full bg-brand text-brand-foreground hover:bg-brand/90">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Jisajili"}</Button>
        <p className="mt-5 text-center text-sm text-muted-foreground">Una akaunti? <Link to="/login" className="font-semibold text-brand hover:underline">Ingia hapa</Link></p>
      </form>
    </div>
  );
}
