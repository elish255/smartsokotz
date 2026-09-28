import type { IncomingMessage, ServerResponse } from "node:http";

type Req = IncomingMessage & { body?: unknown };
type Res = ServerResponse & { statusCode: number; json: (body: unknown) => void };

const RATE_PER_KM = 2000;
const DISTANCES_KM: Record<string, number> = {
  Ilala: 3,
  Kinondoni: 8,
  Temeke: 10,
  Ubungo: 12,
  Kigamboni: 15,
};
const DISTRICT_MINIMUMS: Record<string, number> = {
  Ilala: 5000,
  Kinondoni: 7000,
  Temeke: 10000,
  Ubungo: 7000,
  Kigamboni: 12000,
};

function send(res: Res, body: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req: Req): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  return await new Promise<Record<string, unknown>>((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => {
      raw += chunk;
      if (raw.length > 100_000) reject(new Error("Request too large"));
    });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

export default async function handler(req: Req, res: Res) {
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  if (req.method !== "POST") return send(res, { ok: false, error: "Method not allowed" }, 405);

  try {
    const body = await readBody(req);
    const region = String(body["region"] || "").trim();
    const district = String(body["district"] || "").trim();
    const place = String(body["place"] || "").trim();
    const minimumFee = Number(body["minimumFee"] || 0);

    if (!region || !district || !place) {
      throw new Error("Jaza mkoa, wilaya na mahali pa delivery.");
    }

    // Fixed delivery estimates keep checkout independent of external map services.
    // Dar es Salaam uses district distances; other regions fall back to their configured minimum.
    const districtMinimum = DISTRICT_MINIMUMS[district] || minimumFee || 0;
    const distanceKm = DISTANCES_KM[district] || Math.max(1, Math.ceil(districtMinimum / RATE_PER_KM));
    const distanceRounded = Math.max(1, Math.ceil(distanceKm));
    const deliveryFee = Math.max(distanceRounded * RATE_PER_KM, districtMinimum);

    return send(res, {
      ok: true,
      distanceKm,
      distanceRounded,
      deliveryFee,
    });
  } catch (error) {
    return send(res, { ok: false, error: error instanceof Error ? error.message : "Imeshindikana kupata gharama ya delivery." }, 400);
  }
}
