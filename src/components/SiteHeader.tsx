import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CartDrawer } from "@/components/CartDrawer";
import logo from "@/assets/smart-soko-logo.png";

const navItems = [
  { to: "/", label: "Nyumbani" },
  { to: "/bidhaa", label: "Bidhaa" },
  { to: "/kuhusu", label: "Kuhusu Sisi" },
  { to: "/mawasiliano", label: "Mawasiliano" },
] as const;

export function SiteHeader() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 8) {
        setCompact(false);
      } else if (currentY > lastY + 2) {
        // User swiped/pulled upward: compact the header.
        setCompact(true);
      } else if (currentY < lastY - 2) {
        // User swiped/pulled downward: restore the full header.
        setCompact(false);
      }
      lastY = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur transition-all duration-300 ${
        compact ? "shadow-sm" : ""
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 transition-all duration-300 sm:px-4 ${
          compact ? "py-1.5 sm:py-2" : "py-2.5 sm:py-3"
        }`}
      >
        <Link to="/" aria-label="Smart Soko - Nyumbani" className="flex min-w-0 items-center">
          <img
            src={logo}
            alt="SMART SOKO"
            width={220}
            height={120}
            className={`h-auto object-contain transition-all duration-300 ${compact ? "w-[105px] sm:w-[135px]" : "w-[138px] sm:w-[175px]"}`}
          />
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
