import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/smart-soko-logo.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-surface text-surface-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <img
            src={logo.url}
            alt="Nembo ya SMART SOKO"
            width={56}
            height={56}
            loading="lazy"
            className="mb-2 h-14 w-14 rounded-lg bg-white object-contain p-1"
          />
          <span className="font-display text-lg font-bold">SMART SOKO</span>
          <p className="mt-3 max-w-xs text-sm text-surface-foreground/70">
            Duka la mtandaoni la vifaa vya elektroniki na vifaa vya nyumbani, tukiwahudumia
            wateja Tanzania nzima.
          </p>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold tracking-wide uppercase">Viungo</h3>
          <ul className="mt-3 space-y-2 text-sm text-surface-foreground/70">
            <li>
              <Link to="/bidhaa" className="hover:text-accent">
                Bidhaa zote
              </Link>
            </li>
            <li>
              <Link to="/kuhusu" className="hover:text-accent">
                Kuhusu sisi
              </Link>
            </li>
            <li>
              <Link to="/mawasiliano" className="hover:text-accent">
                Mawasiliano
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold tracking-wide uppercase">
            Wasiliana nasi
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-surface-foreground/70">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-accent" /> +255 700 000 000
            </li>
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