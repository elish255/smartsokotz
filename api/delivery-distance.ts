import type { IncomingMessage, ServerResponse } from "node:http";

type Req = IncomingMessage & { body?: unknown };
type Res = ServerResponse & { statusCode: number; json: (body: unknown) => void };

const GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];
const ORIGIN = "Kariakoo Market, Dar es Salaam, Tanzania";
const RATE_PER_KM = 2000;
const DISTRICT_MINIMUMS: Record<string, number> = { Ilala: 5000, Kinondoni: 7000, Temeke: 10000, Ubungo: 7000, Kigamboni: 12000 };

function send(res: Res, body: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req: Req) {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  return await new Promise<Record<string, unknown>>((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => { raw += chunk; if (raw.length > 100_000) reject(new Error("Request too large")); });
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("Invalid JSON")); } });
    req.on("error", reject);
  });
}

export default async function handler(req: Req, res: Res) {
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  if (req.method !== "POST") return send(res, { ok: false, error: "Method not allowed" }, 405);
  try {
    if (!GOOGLE_MAPS_API_KEY) throw new Error("GOOGLE_MAPS_API_KEY haijawekwa kwenye Vercel.");
    const body = await readBody(req);
    const destination = [body.fullName, body.place, body.district, body.region, "Tanzania"].filter(Boolean).join(", ");
    if (!body.region || !body.district || !body.place) throw new Error("Jaza mkoa, wilaya na mahali pa delivery.");

    const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin: { address: ORIGIN },
        destination: { address: destination },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: false,
        languageCode: "sw-TZ",
        units: "METRIC",
      }),
    });
    const data = await response.json() as any;
    if (!response.ok || !data.routes?.[0]?.distanceMeters) {
      throw new Error(data.error?.message || "Google Maps haikuweza kupata distance ya delivery.");
    }
    const distanceKm = data.routes[0].distanceMeters / 1000;
    const distanceRounded = Math.max(1, Math.ceil(distanceKm));
    const districtMinimum = DISTRICT_MINIMUMS[String(body.district)] || Number(body.minimumFee || 0) || 0;
    const fee = Math.max(distanceRounded * RATE_PER_KM, districtMinimum);
    return send(res, { ok: true, origin: ORIGIN, destination, distanceKm, distanceRounded, ratePerKm: RATE_PER_KM, minimumFee: districtMinimum, deliveryFee: fee, duration: data.routes[0].duration || null });
  } catch (error) {
    return send(res, { ok: false, error: error instanceof Error ? error.message : "Distance calculation failed" }, 400);
  }
}
