import { Link } from "@tanstack/react-router";
import { Phone, Zap } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";

const navItems = [
  { to: "/", label: "Nyumbani" },
  { to: "/bidhaa", label: "Bidhaa" },
  { to: "/kuhusu", label: "Kuhusu Sisi" },
  { to: "/mawasiliano", label: "Mawasiliano" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="bg-surface text-surface-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5 text-xs">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-accent" />
            Usafirishaji wa haraka Tanzania nzima
          </span>
          <a href="tel:+255700000000" className="flex items-center gap-1.5 hover:text-accent">
            <Phone className="h-3.5 w-3.5" />
            +255 700 000 000
          </a>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand font-display text-sm font-bold text-brand-foreground">
            GG
          </span>
          <span className="font-display text-lg font-bold tracking-tight">SMART SOKO</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-brand" }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <CartDrawer />
      </div>
    </header>
  );
}