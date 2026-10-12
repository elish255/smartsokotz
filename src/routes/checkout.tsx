import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Smartphone, MessageCircle, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/shopify";

const WHATSAPP_URL = "https://wa.me/255615180597?text=Habari%20Smart%20Soko%2C%20nimelipia%20naomba%20kupokea%20oda%20yangu.";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Malipo | SMART SOKO" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user, session, loading: authLoading } = useAuth();
  const { items, clearCart } = useCartStore();
  const [phone, setPhone] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [refundAccepted, setRefundAccepted] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price.amount) * item.quantity, 0),
    [items],
  );
  const currency = items[0]?.price.currencyCode ?? "TZS";

  useEffect(() => {
    if (user) setPhone(String(user.phone || user.user_metadata?.phone || ""));
  }, [user]);

  if (authLoading) {
    return <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center px-4 py-16"><div className="rounded-2xl border bg-card p-8 text-center shadow-card"><p className="text-muted-foreground">Tunakagua akaunti yako...</p></div></div>;
  }

  if (!user) {
    return <div className="mx-auto flex min-h-[65vh] max-w-xl items-center justify-center px-4 py-16"><div className="w-full rounded-2xl border bg-card p-8 text-center shadow-card"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand text-brand-foreground"><LogIn className="h-7 w-7" /></span><h1 className="mt-4 font-display text-2xl font-bold">Ingia ili kulipia oda</h1><p className="mt-2 text-muted-foreground">Unahitaji akaunti ya SMART SOKO ili kulipia. Bidhaa ulizoweka kikapuni zitabaki wakati unaingia au kujisajili.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90"><Link to="/login"><LogIn className="mr-2 h-4 w-4" /> Ingia</Link></Button><Button asChild variant="outline"><Link to="/register"><UserPlus className="mr-2 h-4 w-4" /> Jisajili</Link></Button></div><Button asChild variant="ghost" className="mt-3"><Link to="/bidhaa">Endelea kununua</Link></Button></div></div>;
  }

  if (!items.length && !paid) {
    return <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center px-4 py-16"><div className="w-full rounded-2xl border bg-card p-8 text-center shadow-card"><h1 className="font-display text-2xl font-bold">Kikapu chako ni kitupu</h1><p className="mt-2 text-muted-foreground">Ongeza bidhaa kwanza ili kuendelea.</p><Button asChild className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90"><Link to="/bidhaa">Tazama bidhaa</Link></Button></div></div>;
  }

  const payWithPush = async () => {
    if (!/^\+?[0-9\s()-]{9,16}$/.test(phone.trim())) { setMessage("Tafadhali weka namba sahihi ya simu ya malipo."); return; }
    if (!refundAccepted) { setMessage("Tafadhali soma na ukubali Refund Policy kabla ya kuendelea."); return; }
    if (!items.length) return;

    setPaymentLoading(true);
    setMessage(null);
    try {
      const orderItems = items.map(item => ({
        productId: item.product.node.id,
        title: item.product.node.title,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: Number(item.price.amount),
        lineTotal: Number(item.price.amount) * item.quantity,
        imageUrl: item.product.node.images?.edges?.[0]?.node?.url || null,
      }));
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const response = await fetch("/api/payment", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "create",
          amount: subtotal,
          subtotal,
          deliveryFee: 0,
          phone: phone.trim(),
          items: orderItems,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Imeshindikana kuanzisha malipo.");
      setPaymentOrderId(data.orderId);
      setMessage("Push imetumwa. Thibitisha malipo kwenye simu yako. Baada ya kulipa, tutafute WhatsApp kupokea oda yako.");
      void pollPayment(data.orderId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Imeshindikana kuanzisha malipo.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const pollPayment = async (orderId: string) => {
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
        const response = await fetch("/api/payment", {
          method: "POST",
          headers,
          body: JSON.stringify({ action: "status", orderId }),
        });
        const data = await response.json();
        if (data.paid) {
          setPaid(true);
          setMessage("Malipo yamepokelewa. Tafadhali tutafute WhatsApp kupokea oda yako.");
          toast.success("Malipo yamefanikiwa");
          clearCart();
          return;
        }
        if (data.order?.payment_status === "failed") {
          setMessage("Malipo hayajakamilika. Unaweza kujaribu tena.");
          setPaymentOrderId(null);
          return;
        }
      } catch { /* Endelea kuangalia status ya malipo. */ }
    }
    setMessage("Bado hatujapata uthibitisho wa mwisho. Tafadhali angalia simu yako au wasiliana nasi WhatsApp.");
  };

  if (paid) {
    return <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-12"><div className="w-full rounded-3xl border bg-card p-8 text-center shadow-card"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-8 w-8" /></div><h1 className="mt-5 font-display text-2xl font-bold">Oda imepokelewa</h1><p className="mt-2 text-sm text-muted-foreground">Malipo yamepokelewa. Tafadhali wasiliana nasi WhatsApp ili kupokea oda yako.</p><Button asChild className="mt-5 w-full bg-emerald-600 text-white hover:bg-emerald-700"><a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" /> Wasiliana WhatsApp</a></Button><Button asChild variant="outline" className="mt-3 w-full"><Link to="/">Rudi SMART SOKO</Link></Button></div></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-7 md:py-10">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="text-sm font-medium text-brand">← Endelea kununua</Link>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-2xl border bg-white p-5 shadow-card sm:p-7">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white"><Smartphone className="h-5 w-5" /></span><div><h1 className="font-display text-2xl font-bold">Taarifa za malipo</h1><p className="text-sm text-muted-foreground">Malipo yanafanyika kupitia akaunti yako. Hatuhitaji anwani au taarifa za delivery.</p></div></div>
            <div className="mt-6 space-y-4">
              <div><Label>Namba ya simu ya malipo (inaweza kuwa namba ya akaunti yako)</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712345678" className="mt-1" inputMode="tel" autoComplete="tel" /></div>
              <div className="rounded-xl border border-border bg-slate-50 p-4"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={refundAccepted} onChange={e => setRefundAccepted(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-600" /><span className="text-sm"><span className="font-semibold">Nimesoma na kukubali </span><button type="button" onClick={() => setRefundOpen(true)} className="font-semibold text-brand underline underline-offset-2">Refund Policy</button></span></label></div>
            </div>
            {message && <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">{message}</div>}
            <div className="mt-7 border-t pt-6"><h2 className="font-display text-lg font-bold">Malipo</h2><p className="mt-1 text-sm text-muted-foreground">Baada ya kubonyeza LIPA SASA, ombi la malipo litatumwa kwenye simu yako.</p><Button onClick={payWithPush} disabled={paymentLoading || Boolean(paymentOrderId)} size="lg" className="mt-4 h-12 w-full bg-brand text-brand-foreground hover:bg-brand/90">{paymentLoading ? "Inatuma ombi la malipo..." : paymentOrderId ? "Ombi la malipo limetumwa" : "LIPA SASA"}</Button><p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">Note: Ukimaliza kulipia, tutafute WhatsApp kupokea oda yako. Hakuna taarifa za delivery zinazohitajika hapa.</p><a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"><MessageCircle className="h-4 w-4" /> Wasiliana nasi WhatsApp</a></div>
          </section>

          <aside className="h-fit rounded-2xl border bg-white p-5 shadow-card sm:p-7 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-bold">Muhtasari wa oda</h2>
            <div className="mt-5 space-y-4">{items.map(item => <div key={item.variantId} className="flex gap-3"><div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">{item.product.node.images?.edges?.[0]?.node && <img src={item.product.node.images.edges[0].node.url} alt={item.product.node.title} className="h-full w-full object-cover"/>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.product.node.title}</p><p className="text-xs text-muted-foreground">{item.quantity} × {formatPrice(item.price.amount, item.price.currencyCode)}</p></div><p className="text-sm font-semibold">{formatPrice(Number(item.price.amount) * item.quantity, currency)}</p></div>)}</div>
            <div className="mt-6 space-y-3 border-t pt-5 text-sm"><div className="flex justify-between"><span>Bidhaa</span><strong>{formatPrice(subtotal, currency)}</strong></div><div className="flex justify-between border-t pt-3 text-lg"><span>Jumla ya kulipa</span><strong>{formatPrice(subtotal, currency)}</strong></div></div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Baada ya malipo, wasiliana nasi WhatsApp kuhusu oda yako.</p>
          </aside>
        </div>
      </div>
      {refundOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="refund-title" onClick={() => setRefundOpen(false)}><div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}><h2 id="refund-title" className="font-display text-xl font-bold">Refund Policy</h2><p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">Kabla hujalipia, hakikisha idadi ya bidhaa ulizochagua na bei husika. Malipo yaliyokamilika hayatarudishwa isipokuwa kutokee changamoto ya upatikanaji wa bidhaa. Kwa msaada, wasiliana nasi kupitia WhatsApp.</p><p className="mt-3 text-sm font-semibold">WhatsApp: 255615180597</p><div className="mt-6 flex gap-3"><Button onClick={() => { setRefundAccepted(true); setRefundOpen(false); }} className="flex-1 bg-brand text-brand-foreground">Nimekubali</Button><Button variant="outline" onClick={() => setRefundOpen(false)} className="flex-1">Funga</Button></div></div></div>}
    </div>
  );
}
