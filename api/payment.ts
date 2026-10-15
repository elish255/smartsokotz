import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

type Req = IncomingMessage & { body?: unknown };
type Res = ServerResponse & { statusCode: number; json: (body: unknown) => void };
type Obj = Record<string, any>;

const SUPABASE_URL = (process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"])?.replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SECRET_KEY"] || process.env["SUPABASE_SERVICE_ROLE_KEY"];
const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
const SPLASHPAY_API_KEY = process.env["SPLASHPAY_API_KEY"];
const SPLASHPAY_API_SECRET = process.env["SPLASHPAY_API_SECRET"];
const SPLASHPAY_BASE_URL = "https://api.splashpay.co.tz/api/v1";
const PAYMENT_CURRENCY = "TZS";

function send(res: Res, body: unknown, status = 200) { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); }
function firstString(...values: unknown[]) { for (const v of values) { if (typeof v === "string" && v.trim()) return v.trim(); if (typeof v === "number") return String(v); } return undefined; }
function obj(v: unknown): Obj { return v && typeof v === "object" && !Array.isArray(v) ? v as Obj : {}; }
function orderIdOf(payload: Obj) { const d = obj(payload["data"]); return firstString(payload["order_id"], payload["orderId"], d["order_id"], d["orderId"], d["reference"], d["transaction_id"]); }
function statusOf(payload: Obj) { const d = obj(payload["data"]); return firstString(d["payment_status"], d["order_status"], d["status"], payload["payment_status"], payload["order_status"], payload["status"])?.toLowerCase(); }
function failed(status?: string) { return !!status && ["cancelled","usercancelled","rejected","failed","failure","expired","declined"].includes(status); }
async function bodyOf(req: Req): Promise<Obj> { if (req.body && typeof req.body === "object") return req.body as Obj; return new Promise((resolve, reject) => { let raw=""; req.setEncoding("utf8"); req.on("data", (c:string)=>raw+=c); req.on("end",()=>{try{resolve(raw?JSON.parse(raw):{})}catch{reject(new Error("Invalid JSON"))}}); req.on("error",reject); }); }
function bearer(req: Req) { const v=req.headers.authorization; return Array.isArray(v)?v[0]:v; }
async function supa(path: string, init: RequestInit = {}, token?: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase server variables hazijawekwa.");
  const h = new Headers(init.headers); h.set("apikey", token ? (SUPABASE_PUBLISHABLE_KEY || SUPABASE_SERVICE_ROLE_KEY) : SUPABASE_SERVICE_ROLE_KEY); h.set("Content-Type","application/json"); h.set("Prefer", h.get("Prefer") || "return=representation"); if(token) h.set("Authorization", `Bearer ${token}`); else h.set("Authorization", `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`);
  const r=await fetch(`${SUPABASE_URL}/${path}`, {...init,headers:h}); const t=await r.text(); let d:any={}; try{d=t?JSON.parse(t):null}catch{d={message:t}}; if(!r.ok) throw new Error(d["message"]||d["hint"]||d["details"]||`Supabase HTTP ${r.status}`); return d;
}
async function currentUser(token: string) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) throw new Error("Supabase auth variables hazijawekwa.");
  const r=await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` } });
  const d:any=await r.json(); if(!r.ok||!d["id"]) throw new Error("Login session imekwisha. Ingia tena."); return d;
}
async function provider(path: string, payload: Obj, idempotencyKey?: string) {
  if (!SPLASHPAY_API_KEY || !SPLASHPAY_API_SECRET) throw new Error("Huduma ya malipo ya SplashPay haijawekwa sawa. Wasiliana na huduma kwa wateja.");
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json", "X-API-KEY": SPLASHPAY_API_KEY, "X-API-SECRET": SPLASHPAY_API_SECRET };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const r = await fetch(`${SPLASHPAY_BASE_URL}${path}`, { method: "POST", headers, body: JSON.stringify(payload) });
  const t = await r.text(); let d: Obj = {};
  try { d = t ? JSON.parse(t) : {}; } catch { d = { message: t }; }
  if (!r.ok) {
    const errors = obj(d["errors"]); const phoneError = Array.isArray(errors["phone"]) ? errors["phone"].join(", ") : undefined;
    const message = firstString(d["message"], d["error"], phoneError);
    throw new Error(message ? `SplashPay imekataa ombi (HTTP ${r.status}): ${message}` : `SplashPay imekataa ombi (HTTP ${r.status}).`);
  }
  return d;
}

export default async function handler(req: Req, res: Res) {
  if(req.method!=="POST") return send(res,{ok:false,error:"Method not allowed"},405);
  let stage = "kuhakiki akaunti";
  try {
    const auth=bearer(req);
    const token=auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    const user=token ? await currentUser(token) : null;
    const b=await bodyOf(req); const action=String(b["action"]||"create");
    if (!user) throw new Error("Tafadhali ingia kwenye akaunti yako ya SMART SOKO kabla ya kulipia.");
    let profile: Obj | null = null;
    try {
      const profiles = await supa(`rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,full_name,phone`, {}, token);
      profile = profiles?.[0] || null;
    } catch (profileError) {
      // User metadata still contains registration name/phone in the standard flow.
      console.warn("Could not read SMART SOKO profile; using auth metadata.", profileError);
    }

    if(action==="create") {
      stage = "kuhifadhi oda";
      const amount=Math.round(Number(b["amount"])); if(!Number.isFinite(amount)||amount<=0) throw new Error("Kiasi cha malipo si sahihi.");
      const fullName=String(profile?.full_name||user.user_metadata?.full_name||"").trim();
      if(!fullName) throw new Error("Jina halipo kwenye akaunti yako. Rekebisha taarifa za akaunti au wasiliana na WhatsApp.");
      const phone=String(b["phone"]||profile?.phone||user.phone||user.user_metadata?.phone||"").replace(/[^0-9+]/g,"");
      if(phone.replace(/\D/g,"").length<9) throw new Error("Weka namba sahihi ya simu.");
      const rawItems = Array.isArray(b["items"]) ? b["items"] : [];
      if (!rawItems.length) throw new Error("Kikapu hakina bidhaa.");
      const orderRows=await supa("rest/v1/orders",{method:"POST",body:JSON.stringify({user_id:user.id,status:"payment_pending",payment_status:"pending",subtotal:Number(b["subtotal"]||amount),delivery_fee:0,total:amount,currency:PAYMENT_CURRENCY,delivery_full_name:fullName,delivery_region:"",delivery_district:"",delivery_place:"",delivery_distance_km:0,delivery_rate_per_km:0,customer_phone:phone})});
      const order=orderRows?.[0]; if(!order?.id) throw new Error("Oda haikuweza kuhifadhiwa.");
      await supa("rest/v1/order_items", { method: "POST", body: JSON.stringify(rawItems.map((item: any) => ({ order_id: order.id, product_id: String(item.productId || item.variantId || ""), product_title: String(item.title || "Bidhaa"), variant_id: String(item.variantId || ""), quantity: Number(item.quantity || 1), unit_price: Number(item.unitPrice || 0), line_total: Number(item.lineTotal || 0), image_url: item.imageUrl || null }))) });
      stage = "kuanzisha malipo kwenye simu";
      const reference = `INV-${randomUUID()}`;
      let providerResponse: Obj;
      try {
        providerResponse = await provider("/payments/mobile-money", {
          amount, currency: PAYMENT_CURRENCY, reference, phone,
          customer_name: fullName,
          customer_email: user.email || `${String(user.id).slice(0, 8)}@smartsoko.local`,
          metadata: { user_id: user.id, order_id: order.id },
        }, reference);
      } catch (paymentError) {
        await supa(`rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, { method: "PATCH", body: JSON.stringify({ payment_provider: "splashpay", payment_order_id: reference, payment_status: "failed", status: "payment_failed" }) });
        throw paymentError;
      }
      const providerData = obj(providerResponse["data"]);
      const providerStatus = firstString(providerResponse["status"], providerData["status"])?.toLowerCase();
      if (providerResponse["success"] === false || (providerStatus && ["failed", "failure", "error", "rejected"].includes(providerStatus))) {
        await supa(`rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, { method: "PATCH", body: JSON.stringify({ payment_provider: "splashpay", payment_order_id: reference, payment_status: "failed", status: "payment_failed", payment_response: providerResponse }) });
        throw new Error(firstString(providerResponse["message"], providerResponse["error"], providerData["message"]) || "SplashPay imeshindwa kuanzisha malipo.");
      }
      await supa(`rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, { method: "PATCH", body: JSON.stringify({ payment_provider: "splashpay", payment_order_id: reference, payment_response: providerResponse, status: "payment_processing" }) });
      return send(res, { ok: true, orderId: order.id, paymentOrderId: reference, reference, status: "processing", message: "Ombi limetumwa. Thibitisha malipo kwenye simu yako." });
    }

    if(action==="status") {
      stage = "kukagua hali ya malipo";
      const orderId=String(b["orderId"]||""); if(!orderId) throw new Error("orderId inahitajika.");
      const orders=await supa(`rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&select=*`); const order=orders?.[0]; if(!order) throw new Error("Oda haipatikani.");
      // Orders are only accessible by the authenticated account that created them.
      if(!user || order.user_id !== user.id) throw new Error("Oda haipatikani.");
      if(order.payment_status==="paid") return send(res,{ok:true,paid:true,status:"success",order:{payment_status:"paid"}});
      const p=await provider("/payments/check-status", { reference: order.payment_order_id }); const pData=obj(p["data"]); const ps=firstString(pData["status"], p["payment_status"], p["status"])?.toLowerCase() || "pending";
      if (["success", "successful", "completed", "paid"].includes(ps)) {
        const returnedReference = firstString(pData["reference"], pData["merchant_reference"]);
        if ((pData["amount"] !== undefined && Number(pData["amount"]) !== Number(order.total)) || (pData["currency"] && String(pData["currency"]).toUpperCase() !== "TZS") || (returnedReference && returnedReference !== order.payment_order_id)) throw new Error("Taarifa za malipo hazilingani na oda hii. Wasiliana na huduma kwa wateja.");
        await supa(`rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, { method: "PATCH", body: JSON.stringify({ payment_status: "paid", status: "paid", payment_response: p, paid_at: new Date().toISOString() }) });
        return send(res, { ok: true, paid: true, status: ps, order: { payment_status: "paid" } });
      }
      const next=failed(ps)?"failed":"processing"; await supa(`rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,{method:"PATCH",body:JSON.stringify({payment_status:next,status:`payment_${next}`,payment_response:p})}); return send(res,{ok:true,paid:false,status:ps,order:{payment_status:next}});
    }
    throw new Error("Unknown action");
  } catch(error) {
    const message = error instanceof Error ? error.message : "Hitilafu isiyojulikana.";
    console.error("SMART SOKO payment error at stage:", stage, error);
    return send(res, { ok: false, stage, error: message || "Imeshindikana kukamilisha malipo. Tafadhali jaribu tena." }, 400);
  }
}
