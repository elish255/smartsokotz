import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CreditCard,
  LockKeyhole,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/smart-soko-logo.png";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Malipo | SMART SOKO" },
      {
        name: "description",
        content: "Kamilisha oda yako kwa kuchagua njia salama ya malipo kwenye SMART SOKO.",
      },
    ],
  }),
  component: CheckoutPage,
});

type PaymentMethod = "push" | "card" | "lipanamba" | null;

const LIPA_NUMBER = (import.meta.env.VITE_LIPA_NUMBER as string | undefined) || "Haijawekwa";
const BUSINESS_NAME = "SMART SOKO";
const SHIPPING_FEE = 29000;

function CheckoutPage() {
  const { items, checkoutUrl } = useCartStore();
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [phone, setPhone] = useState("");
  const [operator, setOperator] = useState("Vodacom M-Pesa");
  const [showLipaDetails, setShowLipaDetails] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price.amount) * item.quantity, 0),
    [items],
  );
  const shipping = items.length > 0 ? SHIPPING_FEE : 0;
  const taxes = Math.round(subtotal * 0.2);
  const total = subtotal + shipping + taxes;
  const currency = items[0]?.price.currencyCode ?? "TZS";

  const chooseMethod = (next: Exclude<PaymentMethod, null>) => {
    setMethod(next);
    setStatus(null);
    if (next !== "lipanamba") setShowLipaDetails(false);
  };

  const handlePayNow = async () => {
    if (!method || !items.length) return;

    if (method === "push") {
      const normalized = phone.replace(/\D/g, "");
      if (normalized.length < 9) {
        setStatus("Tafadhali weka namba sahihi ya simu.");
        return;
      }

      setIsProcessing(true);
      setStatus(null);

      try {
        const formData = new FormData();
        formData.append("userID", "smart-soko");
        formData.append("phone", normalized);
        formData.append("amount", String(total));
        formData.append("business", BUSINESS_NAME);

        // This endpoint is configurable so the live payment gateway can be connected
        // without placing a private credential directly in the page source.
        const endpoint = import.meta.env.VITE_PAYMENT_ORDER_URL as string | undefined;
        if (!endpoint) {
          setStatus("Push imechaguliwa. Weka VITE_PAYMENT_ORDER_URL kwenye mazingira ya deployment ili kutuma ombi la malipo.");
          return;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Payment request failed");
        setStatus(`Push imetumwa kwenye ${phone}. Tafadhali thibitisha muamala kwenye simu yako.`);
      } catch {
        setStatus("Imeshindikana kutuma Push kwa sasa. Tafadhali jaribu tena.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (method === "card") {
      if (!cardName || cardNumber.replace(/\s/g, "").length < 12 || !cardExpiry || cardCvv.length < 3) {
        setStatus("Tafadhali jaza taarifa zote za kadi.");
        return;
      }

      const endpoint = import.meta.env.VITE_CARD_PAYMENT_URL as string | undefined;
      if (endpoint) {
        setIsProcessing(true);
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cardName, cardNumber, cardExpiry, cardCvv, amount: total, currency }),
          });
          if (!response.ok) throw new Error("Card payment failed");
          setStatus("Ombi la malipo ya kadi limetumwa.");
        } catch {
          setStatus("Imeshindikana kuchakata malipo ya kadi. Tafadhali jaribu tena.");
        } finally {
          setIsProcessing(false);
        }
      } else if (checkoutUrl) {
        // The Shopify checkout is the safe fallback for card processing when no
        // dedicated card gateway endpoint has been configured.
        window.location.href = checkoutUrl;
      } else {
        setStatus("Card payment gateway haijaunganishwa bado.");
      }
      return;
    }

    setStatus("Tumia LIPA NAMBA iliyoonyeshwa hapo juu, kisha thibitisha muamala wako.");
  };

  if (!items.length) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center px-4 py-16">
        <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-card">
          <h1 className="font-display text-2xl font-bold">Kikapu chako ni kitupu</h1>
          <p className="mt-2 text-muted-foreground">Ongeza bidhaa kwanza ili kuendelea na malipo.</p>
          <Button asChild className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
            <Link to="/bidhaa">Tazama bidhaa</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline">
          <ArrowLeft className="h-4 w-4" /> Rudi Smart Soko
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-7">
            <div className="mb-5 flex items-center justify-between gap-4 border-b pb-5">
              <div className="min-w-0">
                <img src={logo} alt="SMART SOKO" width={220} height={120} className="mb-3 h-auto w-[150px] object-contain sm:w-[175px]" />
                <h1 className="font-display text-2xl font-bold text-slate-900">Order summary</h1>
                <p className="mt-1 text-sm text-slate-500">Bidhaa {items.reduce((s, i) => s + i.quantity, 0)} kwenye oda</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">SMART SOKO</span>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-4 rounded-xl border border-slate-100 p-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.product.node.images?.edges?.[0]?.node && (
                      <img
                        src={item.product.node.images.edges[0].node.url}
                        alt={item.product.node.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-slate-900">{item.product.node.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">Qty: {item.quantity}</p>
                    {item.selectedOptions.length > 0 && (
                      <p className="text-xs text-slate-400">{item.selectedOptions.map((o) => `${o.name}: ${o.value}`).join(" • ")}</p>
                    )}
                  </div>
                  <div className="text-right font-semibold text-slate-900">
                    {formatPrice(Number(item.price.amount) * item.quantity, currency)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 space-y-3 border-t pt-5 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal, currency)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{formatPrice(shipping, currency)}</span></div>
              <div className="flex justify-between"><span>Estimated taxes</span><span>{formatPrice(taxes, currency)}</span></div>
              <div className="flex items-end justify-between border-t pt-4">
                <span className="text-lg font-bold">Total</span>
                <span className="font-display text-2xl font-bold">{formatPrice(total, currency)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm md:p-7">
            <div className="mb-5">
              <h2 className="font-display text-2xl font-bold text-slate-900">Payment</h2>
              <p className="mt-1 text-sm text-slate-500">Choose payment Methods</p>
            </div>

            <div className="space-y-3">
              <PaymentChoice
                selected={method === "push"}
                icon={<Smartphone className="h-5 w-5" />}
                title="Lipa kwa USSD Push"
                description="Tuma ombi la malipo moja kwa moja kwenye simu yako."
                onClick={() => chooseMethod("push")}
              />
              {method === "push" && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Namba ya simu</label>
                  <div className="flex overflow-hidden rounded-lg border bg-white focus-within:ring-2 focus-within:ring-blue-200">
                    <span className="flex items-center border-r bg-slate-100 px-3 text-sm font-semibold text-slate-600">+255</span>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="06XXXXXXXX"
                      inputMode="tel"
                      className="border-0 shadow-none focus-visible:ring-0"
                      maxLength={10}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Push itatumwa kwenda kwenye namba uliyojaza hapo juu.</p>
                </div>
              )}

              <PaymentChoice
                selected={method === "card"}
                icon={<CreditCard className="h-5 w-5" />}
                title="Lipa kwa Card"
                description="Endelea kwenye checkout salama kwa malipo ya kadi."
                onClick={() => chooseMethod("card")}
              />
              {method === "card" && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><LockKeyhole className="h-4 w-4" /> Taarifa za Card</div>
                  <div className="space-y-3">
                    <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Jina lililo kwenye card" autoComplete="cc-name" />
                    <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Card number" inputMode="numeric" autoComplete="cc-number" maxLength={19} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" inputMode="numeric" autoComplete="cc-exp" maxLength={5} />
                      <Input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="CVV" inputMode="numeric" autoComplete="cc-csc" maxLength={4} />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Taarifa hizi hazihifadhiwi kwenye browser; zitatumwa tu kwenye payment gateway iliyowekwa na mwenye duka.</p>
                </div>
              )}

              <PaymentChoice
                selected={method === "lipanamba"}
                icon={<WalletCards className="h-5 w-5" />}
                title="Lipa kwa Lipa namba"
                description="Chagua mtandao kuona hatua za kulipa kwa LIPA NAMBA."
                onClick={() => {
                  chooseMethod("lipanamba");
                  setShowLipaDetails(true);
                }}
              />
              {method === "lipanamba" && showLipaDetails && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <button
                    type="button"
                    onClick={() => setShowLipaDetails((value) => !value)}
                    className="flex w-full items-center justify-between text-left font-semibold text-slate-800"
                  >
                    <span>Maelezo ya LIPA NAMBA</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Mtandao</label>
                    <select value={operator} onChange={(e) => setOperator(e.target.value)} className="w-full rounded-lg border bg-white px-3 py-3 outline-none focus:border-blue-500">
                      <option>Vodacom M-Pesa</option>
                      <option>Mixx by Yas</option>
                      <option>Airtel Money</option>
                      <option>HaloPesa</option>
                    </select>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p>1. Fungua huduma ya {operator}.</p>
                      <p className="mt-1">2. Chagua huduma ya kulipia bidhaa / bili.</p>
                      <p className="mt-1">3. Weka <strong>LIPA NAMBA</strong>:</p>
                      <div className="mt-2 flex items-center justify-between rounded-lg bg-white px-3 py-2">
                        <strong className="text-lg tracking-wide text-slate-900">{LIPA_NUMBER}</strong>
                        <button type="button" onClick={() => navigator.clipboard?.writeText(LIPA_NUMBER)} className="text-xs font-semibold text-brand">Copy</button>
                      </div>
                      <p className="mt-2">4. Weka kiasi cha <strong>{formatPrice(total, currency)}</strong>.</p>
                      <p className="mt-1">5. Thibitisha kwa PIN yako.</p>
                      <p className="mt-3 rounded-md bg-white px-3 py-2 text-xs">Jina la biashara: <strong>{BUSINESS_NAME}</strong></p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {status && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                {status}
              </div>
            )}

            <Button
              onClick={handlePayNow}
              disabled={!method || isProcessing}
              size="lg"
              className="mt-6 h-12 w-full bg-brand text-brand-foreground hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? "Inatuma Push..." : <>Pay Now <Check className="ml-2 h-4 w-4" /></>}
            </Button>
            <p className="mt-3 text-center text-xs text-slate-400">All transactions are secure and encrypted.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function PaymentChoice({
  selected,
  icon,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition ${selected ? "border-brand bg-blue-50/50" : "border-slate-200 bg-white hover:border-slate-300"}`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-slate-900">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? "border-brand bg-brand" : "border-slate-300"}`}>
        {selected && <Check className="h-3 w-3 text-white" />}
      </span>
    </button>
  );
}
