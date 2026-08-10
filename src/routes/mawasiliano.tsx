import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/mawasiliano")({
  head: () => ({
    meta: [
      { title: "Mawasiliano | GG STORE" },
      {
        name: "description",
        content:
          "Wasiliana na GG STORE kwa simu, WhatsApp au barua pepe kwa maswali kuhusu bidhaa, oda na usafirishaji.",
      },
      { property: "og:title", content: "Wasiliana na GG STORE" },
      {
        property: "og:description",
        content: "Namba za simu, barua pepe na eneo la duka letu Dar es Salaam.",
      },
    ],
  }),
  component: ContactPage,
});

const channels = [
  { icon: Phone, label: "Simu / WhatsApp", value: "+255 700 000 000", href: "tel:+255700000000" },
  { icon: Mail, label: "Barua pepe", value: "info@ggstore.co.tz", href: "mailto:info@ggstore.co.tz" },
  { icon: MapPin, label: "Eneo", value: "Dar es Salaam, Tanzania", href: null },
];

function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Wasiliana Nasi</h1>
      <p className="mt-3 text-muted-foreground">
        Una swali kuhusu bidhaa, oda au usafirishaji? Timu yetu ipo tayari kukusaidia.
      </p>
      <div className="mt-8 space-y-4">
        {channels.map((channel) => (
          <div
            key={channel.label}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-5 shadow-card"
          >
            <channel.icon className="h-5 w-5 text-brand" />
            <div>
              <p className="text-xs text-muted-foreground">{channel.label}</p>
              {channel.href ? (
                <a href={channel.href} className="font-medium hover:text-brand">
                  {channel.value}
                </a>
              ) : (
                <p className="font-medium">{channel.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}