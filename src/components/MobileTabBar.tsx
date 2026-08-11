import { Link } from "@tanstack/react-router";
import { Home, Info, LayoutGrid, Phone } from "lucide-react";

const tabs = [
  { to: "/", label: "Nyumbani", icon: Home, exact: true },
  { to: "/bidhaa", label: "Bidhaa", icon: LayoutGrid, exact: false },
  { to: "/kuhusu", label: "Kuhusu", icon: Info, exact: false },
  { to: "/mawasiliano", label: "Mawasiliano", icon: Phone, exact: false },
] as const;

export function MobileTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <Link
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              activeProps={{ className: "text-brand" }}
              className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-medium text-muted-foreground"
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
