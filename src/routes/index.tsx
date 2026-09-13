import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Truck, Headphones, CreditCard, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-electronics.jpg";
import { Button } from "@/components/ui/button";
import { ProductBrowser } from "@/components/ProductBrowser";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { name: "zonmpay-verification", content: "zmp-verify-3f661249d8ba85d72f17bbb2ba510c61" },
      { title: "SMART SOKO | Elektroniki na Vifaa vya Nyumbani Tanzania" },
      {
        name: "description",
        content:
          "Pata Bidhaa za Elektroniki na vifaa vya nyumbani kwa bei Nafuu. SMART SOKO hukupa bidhaa bora kwa malipo salama.",
      },
      { property: "og:title", content: "SMART SOKO | Elektroniki na Vifaa vya Nyumbani" },
      {
        property: "og:description",
        content: "Duka la mtandaoni la elektroniki Tanzania — bei nafuu na huduma ya haraka.",
      },
    ],
  }),
  component: Index,
});

const perks = [
  { icon: Truck, title: "Bei Nafuu", text: "Pata bidhaa za elektroniki na vifaa vya nyumbani kwa bei nafuu." },
  { icon: ShieldCheck, title: "Bidhaa Halisi", text: "Kila bidhaa ina dhamana na uhakika." },
  { icon: CreditCard, title: "Malipo Salama", text: "Lipa kwa kadi au mitandao ya simu." },
  { icon: Headphones, title: "Huduma 24/7", text: "Timu yetu ipo tayari kukusaidia." },
];

function Index() {
  return (
    <>
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:grid-cols-2 md:py-20">
          <div className="text-surface-foreground">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-accent">
              Karibu SMART SOKO
            </span>
            <h1 className="mt-4 font-display text-4xl leading-tight font-bold md:text-5xl">
              Pata Bidhaa za Elektroniki na vifaa vya nyumbani kwa bei Nafuu
            </h1>
            <p className="mt-4 max-w-md text-sm text-surface-foreground/80 md:text-base">
              Simu, laptop, TV, friji, majiko na vifaa vingine vya nyumbani — vyote vinapatikana
              mahali pamoja kwa bei nafuu.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Link to="/bidhaa">
                  Nunua sasa <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl shadow-lift">
            <img
              src={heroImage}
              alt="Vifaa vya elektroniki na vifaa vya nyumbani vya SMART SOKO"
              width={1600}
              height={1008}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((perk) => (
            <div key={perk.title} className="flex items-start gap-3">
              <perk.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand" />
              <div>
                <h2 className="font-display text-sm font-semibold">{perk.title}</h2>
                <p className="text-xs text-muted-foreground">{perk.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Bidhaa Zetu</h2>
            <p className="text-sm text-muted-foreground">Chagua kutoka kwenye kolekshemu yetu</p>
          </div>
          <Link to="/bidhaa" className="text-sm font-medium text-brand hover:underline">
            Ona zote
          </Link>
        </div>
      </div>
      <ProductBrowser />
    </>
  );
}
