import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, MapPin, Smartphone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/hooks/useAuth";
import { TANZANIA_REGIONS, getRegion } from "@/data/tanzania";
import { supabaseRest } from "@/lib/supabase";
import { formatPrice } from "@/lib/shopify";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Malipo | SMART SOKO" }] }),
  component: CheckoutPage,
});

type DistanceResult = { distanceKm: number; distanceRounded: number; deliveryFee: number; ratePerKm: number; minimumFee: number; duration: string | null };

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const { items, clearCart } = useCartStore();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("Dar es Salaam");
  const [district, setDistrict] = useState("");
  const [place, setPlace] = useState("");
  const [distance, setDistance] = useState<DistanceResult | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  const selectedRegion = getRegion(region);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.price.amount) * item.quantity, 0), [items]);
  const deliveryFee = distance?.deliveryFee ?? 0;
  const total = subtotal + deliveryFee;
  const currency = items[0]?.price.currencyCode ?? "TZS";

  useEffect(() => {
    if (!authLoading && !user) return;
    if (user) {
      setFullName(String(user.user_metadata?.full_name || ""));
      setPhone(String(user.user_metadata?.phone || ""));
    }
  }, [authLoading, user]);

  useEffect(() => {
    setDistrict("");
    setDistance(null);
  }, [region]);

  if (!items.length && !paid) {
    return <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center px-4 py-16"><div className="w-full rounded-2xl border bg-card p-8 text-center shadow-card"><h1 className="font-display text-2xl font-bold">Kikapu chako ni kitupu</h1><p className="mt-2 text-muted-foreground">Ongeza bidhaa kwanza ili kuendelea.</p><Button asChild className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90"><Link to="/bidhaa">Tazama bidhaa</Link></Button></div></div>;
  }

  if (!authLoading && !user) {
    return <div className="mx-auto flex min-h-[65vh] max-w-md items-center px-4 py-12"><div className="w-full rounded-2xl border bg-card p-7 text-center shadow-card"><UserRound className="mx-auto h-10 w-10 text-brand"/><h1 className="mt-4 font-display text-2xl font-bold">Ingia ili kulipia</h1><p className="mt-2 text-sm text-muted-foreground">Tunahitaji akaunti yako ili kuhifadhi oda na taarifa za delivery.</p><div className="mt-6 grid gap-3"><Button onClick={() => navigate({ to: "/register" })} className="bg-brand text-brand-foreground">Jisajili</Button><Button variant="outline" onClick={() => navigate({ to: "/login" })}>Ingia</Button></div></div></div>;
  }

  const calculateDistance = async () => {
    if (!fullName.trim() || !phone.trim() || !region || !district || !place.trim()) { setMessage("Jaza majina kamili, namba ya simu, mkoa, wilaya na mahali pa kufikishiwa."); return; }
    setDistanceLoading(true); setMessage(null); setDistance(null);
    try {
      const response = await fetch("/api/delivery-distance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, region, district, place, minimumFee: selectedRegion?.minimumFee || 0 }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Imeshindikana kupata distance.");
      setDistance(data); setMessage(`Gharama ya delivery: ${formatPrice(data.deliveryFee, currency)}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Imeshindikana kupata bei ya delivery."); }
    finally { setDistanceLoading(false); }
  };

  const payWithPush = async () => {
    if (!session?.access_token) { navigate({ to: "/login" }); return; }
    if (!distance) { setMessage("Kwanza kamilisha taarifa za delivery na bonyeza Hesabu Delivery."); return; }
    if (!items.length) return;
    setPaymentLoading(true); setMessage(null);
    try {
      const orderItems = items.map(item => ({ productId: item.product.node.id, title: item.product.node.title, variantId: item.variantId, quantity: item.quantity, unitPrice: Number(item.price.amount), lineTotal: Number(item.price.amount) * item.quantity, imageUrl: item.product.node.images?.edges?.[0]?.node?.url || null }));
      const response = await fetch("/api/payment", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ action: "create", amount: total, subtotal, deliveryFee, distanceKm: distance.distanceKm, deliveryFullName: fullName.trim(), region, district, place: place.trim(), phone: phone.trim(), items: orderItems }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Imeshindikana kuanzisha malipo.");
      setPaymentOrderId(data.orderId); setMessage("Push imetumwa. Thibitisha malipo kwenye simu yako. Mfumo utaangalia status moja kwa moja.");
      void pollPayment(data.orderId);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Imeshindikana kuanzisha malipo."); }
    finally { setPaymentLoading(false); }
  };

  const pollPayment = async (orderId: string) => {
    if (!session?.access_token) return;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        const response = await fetch("/api/payment", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ action: "status", orderId }) });
        const data = await response.json();
        if (data.paid) { setPaid(true); setMessage("Malipo yamepokelewa. Oda yako imekamilika."); toast.success("Malipo yamefanikiwa"); clearCart(); return; }
        if (data.order?.payment_status === "failed") { setMessage("Malipo hayajakamilika. Unaweza kujaribu tena."); return; }
      } catch { /* keep polling */ }
    }
    setMessage("Bado hatujapata uthibitisho wa mwisho. Unaweza kuangalia tena kwa kujaribu malipo baada ya muda.");
  };

  if (paid) {
    return <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-12"><div className="w-full rounded-3xl border bg-card p-8 text-center shadow-card"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-8 w-8" /></div><h1 className="mt-5 font-display text-2xl font-bold">Oda imepokelewa</h1><p className="mt-2 text-sm text-muted-foreground">Malipo yamepokelewa na taarifa zako za delivery zimehifadhiwa.</p><Button asChild className="mt-6 bg-brand text-brand-foreground"><Link to="/">Rudi SMART SOKO</Link></Button></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-7 md:py-10">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="text-sm font-medium text-brand">← Endelea kununua</Link>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-2xl border bg-white p-5 shadow-card sm:p-7">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white"><MapPin className="h-5 w-5" /></span><div><h1 className="font-display text-2xl font-bold">Taarifa za delivery</h1><p className="text-sm text-muted-foreground">Lazima ujaze taarifa hizi kabla ya malipo kuwashwa.</p></div></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Majina kamili</Label><Input value={fullName} onChange={e => { setFullName(e.target.value); setDistance(null); }} placeholder="Jina kamili la mpokeaji" className="mt-1" /></div>
              <div><Label>Namba ya simu</Label><Input value={phone} onChange={e => { setPhone(e.target.value); setDistance(null); }} placeholder="0712345678" className="mt-1" /></div>
              <div><Label>Mkoa</Label><select value={region} onChange={e => setRegion(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm">{TANZANIA_REGIONS.map(r => <option key={r.name}>{r.name}</option>)}</select></div>
              <div><Label>Wilaya</Label><div className="relative mt-1"><select value={district} onChange={e => { setDistrict(e.target.value); setDistance(null); }} className="h-10 w-full appearance-none rounded-md border bg-background px-3 pr-9 text-sm"><option value="">Chagua wilaya</option>{selectedRegion?.districts.map(d => <option key={d}>{d}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground"/></div></div>
              <div><Label>Mahali anapopokea</Label><Input value={place} onChange={e => { setPlace(e.target.value); setDistance(null); }} placeholder="Mfano: Mtaa, nyumba, eneo" className="mt-1" /></div>
            </div>
            
            <Button onClick={calculateDistance} disabled={distanceLoading} className="mt-5 w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800">{distanceLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Inapima distance...</> : "Hesabu Delivery"}</Button>
            {distance && <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><span className="text-xs text-muted-foreground">Umbali</span><p className="font-bold">{distance.distanceKm.toFixed(1)} km</p></div><div className="rounded-xl bg-slate-50 p-3"><span className="text-xs text-muted-foreground">Gharama ya delivery</span><p className="font-bold">{formatPrice(distance.deliveryFee, currency)}</p></div></div>}
            {message && <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">{message}</div>}
            <div className="mt-7 border-t pt-6"><h2 className="font-display text-lg font-bold">Malipo</h2><p className="mt-1 text-sm text-muted-foreground">Thibitisha malipo kwenye simu yako baada ya kubonyeza kitufe hapa chini.</p><Button onClick={payWithPush} disabled={!distance || paymentLoading || Boolean(paymentOrderId)} size="lg" className="mt-4 h-12 w-full bg-brand text-brand-foreground hover:bg-brand/90"><Smartphone className="mr-2 h-5 w-5"/>{paymentLoading ? "Inatuma..." : paymentOrderId ? "Malipo yametumwa" : "Lipa sasa"}</Button></div>
          </section>

          <aside className="h-fit rounded-2xl border bg-white p-5 shadow-card sm:p-7 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-bold">Muhtasari wa oda</h2>
            <div className="mt-5 space-y-4">{items.map(item => <div key={item.variantId} className="flex gap-3"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">{item.product.node.images?.edges?.[0]?.node && <img src={item.product.node.images.edges[0].node.url} alt={item.product.node.title} className="h-full w-full object-cover"/>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.product.node.title}</p><p className="text-xs text-muted-foreground">{item.quantity} × {formatPrice(item.price.amount, currency)}</p></div><p className="text-sm font-semibold">{formatPrice(Number(item.price.amount) * item.quantity, currency)}</p></div>)}</div>
            <div className="mt-6 space-y-3 border-t pt-5 text-sm"><div className="flex justify-between"><span>Bidhaa</span><strong>{formatPrice(subtotal, currency)}</strong></div><div className="flex justify-between"><span>Delivery</span><strong>{distance ? formatPrice(deliveryFee, currency) : "—"}</strong></div><div className="flex justify-between border-t pt-3 text-lg"><span>Jumla</span><strong>{formatPrice(total, currency)}</strong></div></div>
            <p className="mt-4 text-xs text-muted-foreground">Button ya malipo itawaka baada ya taarifa zote za delivery na distance kukamilika.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
