import { createFileRoute } from "@tanstack/react-router";
import { Store, Truck, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/kuhusu")({
  head: () => ({
    meta: [
      { title: "Kuhusu Sisi | SMART SOKO" },
      {
        name: "description",
        content:
          "SMART SOKO ni duka la Kitanzania linalouza vifaa vya elektroniki na vifaa vya nyumbani vyenye ubora kwa bei nafuu.",
      },
      { property: "og:title", content: "Kuhusu SMART SOKO" },
      {
        property: "og:description",
        content: "Historia yetu, dhamira na huduma tunazotoa kwa wateja Tanzania.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: Store, title: "Bidhaa zenye ubora", text: "Tunachagua bidhaa halisi kutoka kwa wasambazaji wanaoaminika." },
  { icon: Truck, title: "Huduma ya haraka", text: "Oda zinasindikwa siku hiyo hiyo na kufikishwa nchi nzima." },
  { icon: ShieldCheck, title: "Uaminifu", text: "Bei wazi, dhamana ya bidhaa na msaada baada ya mauzo." },
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Kuhusu SMART SOKO</h1>
      <p className="mt-4 text-muted-foreground">
        SMART SOKO ni duka la mtandaoni la Kitanzania linalojishughulisha na uuzaji wa vifaa vya
        elektroniki na vifaa vya nyumbani. Tumejikita katika kuleta bidhaa bora kwa bei nafuu,
        tukiwarahisishia wateja wetu kununua wakiwa nyumbani au kazini.
      </p>
      <p className="mt-4 text-muted-foreground">
        Kuanzia simu janja, laptop na televisheni hadi friji, majiko na mashine za kufulia —
        lengo letu ni kukupa uzoefu wa ununuzi ulio rahisi, salama na wa haraka.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {values.map((value) => (
          <div key={value.title} className="rounded-lg border border-border bg-card p-5 shadow-card">
            <value.icon className="h-6 w-6 text-brand" />
            <h2 className="mt-3 font-display text-sm font-semibold">{value.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{value.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}