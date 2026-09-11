import { Link } from "@tanstack/react-router";
import { Mail, MapPin } from "lucide-react";
import logo from "@/assets/smart-soko-logo.png";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-surface text-surface-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <Link to="/" aria-label="Smart Soko - Nyumbani" className="inline-block">
            <img
              src={logo}
              alt="SMART SOKO"
              width={280}
              height={280}
              loading="lazy"
              className="mb-3 h-auto w-[190px] object-contain"
            />
          </Link>
          <p className="mt-1 max-w-xs text-sm text-surface-foreground/70">
            Duka la mtandaoni la vifaa vya elektroniki na vifaa vya nyumbani, tukiwahudumia
            wateja Tanzania nzima.
          </p>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold tracking-wide uppercase">Viungo</h3>
          <ul className="mt-3 space-y-2 text-sm text-surface-foreground/70">
            <li><Link to="/bidhaa" className="hover:text-accent">Bidhaa zote</Link></li>
            <li><Link to="/kuhusu" className="hover:text-accent">Kuhusu sisi</Link></li>
            <li><Link to="/mawasiliano" className="hover:text-accent">Mawasiliano</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold tracking-wide uppercase">Wasiliana nasi</h3>
          <ul className="mt-3 space-y-2 text-sm text-surface-foreground/70">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" /> info@smartsoko.co.tz
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> Dar es Salaam, Tanzania
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-surface-foreground/60">
        © {new Date().getFullYear()} SMART SOKO. Haki zote zimehifadhiwa.
      </div>
    </footer>
  );
}
