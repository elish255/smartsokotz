import type { IncomingMessage, ServerResponse } from "node:http";

type Req = IncomingMessage & { body?: unknown };
type Res = ServerResponse & { statusCode: number; json: (body: unknown) => void };
type Obj = Record<string, any>;

const SUPABASE_URL = process.env["SUPABASE_URL"]?.replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env["SUPABASE_SECRET_KEY"] || process.env["SUPABASE_SERVICE_ROLE_KEY"];
const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
const FIMIPAY_API_KEY = process.env["FIMIPAY_API_KEY"];
const FIMIPAY_CURRENCY = process.env["FIMIPAY_CURRENCY"] || "TZS";
const CREATE_URL = process.env["FIMIPAY_CREATE_PAYMENT_URL"] || "https://fimipay.com/api/v1/payment/create_order";
const STATUS_URL = process.env["FIMIPAY_ORDER_STATUS_URL"] || "https://fimipay.com/api/v1/payment/order_status";

function send(res: Res, body: unknown, status = 200) { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); }
function firstString(...values: unknown[]) { for (const v of values) { if (typeof v === "string" && v.trim()) return v.trim(); if (typeof v === "number") return String(v); } return undefined; }
function obj(v: unknown): Obj { return v && typeof v === "object" && !Array.isArray(v) ? v as Obj : {}; }
function orderIdOf(payload: Obj) { const d = obj(payload.data); return firstString(payload.order_id, payload.orderId, d.order_id, d.orderId, d.reference, d.transaction_id); }
function statusOf(payload: Obj) { const d = obj(payload.data); return firstString(d.payment_status, d.order_status, payload.payment_status, payload.order_status)?.toLowerCase(); }
function failed(status?: string) { return !!status && ["cancelled","usercancelled","rejected","failed","failure","expired","declined"].includes(status); }
async function bodyOf(req: Req): Promise<Obj> { if (req.body && typeof req.body === "object") return req.body as Obj; return new Promise((resolve, reject) => { let raw=""; req.setEncoding("utf8"); req.on("data", (c:string)=>raw+=c); req.on("end",()=>{try{resolve(raw?JSON.parse(raw):{})}catch{reject(new Error("Invalid JSON"))}}); req.on("error",reject); }); }
function bearer(req: Req) { const v=req.headers.authorization; return Array.isArray(v)?v[0]:v; }
async function supa(path: string, init: RequestInit = {}, token?: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase server variables hazijawekwa.");
  const h = new Headers(init.headers); h.set("apikey", token ? (SUPABASE_PUBLISHABLE_KEY || SUPABASE_SERVICE_ROLE_KEY) : SUPABASE_SERVICE_ROLE_KEY); h.set("Content-Type","application/json"); h.set("Prefer", h.get("Prefer") || "return=representation"); if(token) h.set("Authorization", `Bearer ${token}`); else h.set("Authorization", `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`);
  const r=await fetch(`${SUPABASE_URL}/${path}`, {...init,headers:h}); const t=await r.text(); let d:any={}; try{d=t?JSON.parse(t):null}catch{d={message:t}}; if(!r.ok) throw new Error(d.message||d.hint||d.details||`Supabase HTTP ${r.status}`); return d;
}
async function currentUser(token: string) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) throw new Error("Supabase auth variables hazijawekwa.");
  const r=await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` } });
  const d:any=await r.json(); if(!r.ok||!d.id) throw new Error("Login session imekwisha. Ingia tena."); return d;
}
async function provider(url: string, payload: Obj) {
  if (!FIMIPAY_API_KEY) throw new Error("FIMIPAY_API_KEY haijawekwa.");
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","Authorization":`Bearer ${FIMIPAY_API_KEY}`},body:JSON.stringify(payload)});
  const t=await r.text(); let d:Obj={}; try{d=t?JSON.parse(t):{}}catch{d={raw:t}}; if(!r.ok) throw new Error(firstString(d.message,d.error,d.detail)||`FimiPay HTTP ${r.status}`); return d;
}

export default async function handler(req: Req, res: Res) {
  if(req.method!=="POST") return send(res,{ok:false,error:"Method not allowed"},405);
  try {
    const auth=bearer(req); if(!auth?.startsWith("Bearer ")) throw new Error("Login session is required");
    const token=auth.slice(7).trim(); const user=await currentUser(token); const b=await bodyOf(req); const action=String(b.action||"create");
    const profiles=await supa(`rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,full_name,phone` ,{}, token); const profile=profiles?.[0];
    if(!profile) throw new Error("User profile haijapatikana.");

    if(action==="create") {
      const amount=Math.round(Number(b.amount)); if(!Number.isFinite(amount)||amount<=0) throw new Error("Kiasi cha malipo si sahihi.");
      const phone=String(b.phone||profile.phone||"").replace(/[^0-9+]/g,"");
      if(phone.length<9) throw new Error("Weka namba sahihi ya simu.");
      const orderRows=await supa("rest/v1/orders",{method:"POST",body:JSON.stringify({user_id:user.id,status:"payment_pending",payment_status:"pending",subtotal:Number(b.subtotal||0),delivery_fee:Number(b.deliveryFee||0),total:amount,currency:FIMIPAY_CURRENCY,delivery_full_name:String(b.deliveryFullName||profile.full_name||""),delivery_region:String(b.region||""),delivery_district:String(b.district||""),delivery_place:String(b.place||""),delivery_distance_km:Number(b.distanceKm||0),delivery_rate_per_km:2000,customer_phone:phone})});
      const order=orderRows?.[0]; if(!order?.id) throw new Error("Oda haikuweza kuhifadhiwa.");
      const rawItems = Array.isArray(b.items) ? b.items : [];
      if (!rawItems.length) throw new Error("Kikapu hakina bidhaa.");
      await supa("rest/v1/order_items", { method: "POST", body: JSON.stringify(rawItems.map((item: any) => ({ order_id: order.id, product_id: String(item.productId || item.variantId || ""), product_title: String(item.title || "Bidhaa"), variant_id: String(item.variantId || ""), quantity: Number(item.quantity || 1), unit_price: Number(item.unitPrice || 0), line_total: Number(item.lineTotal || 0), image_url: item.imageUrl || null }))) });
      const providerResponse=await provider(CREATE_URL,{buyer_email:user.email||"",buyer_name:String(b.deliveryFullName||profile.full_name||"SMART SOKO Customer"),buyer_phone:phone,amount,currency:FIMIPAY_CURRENCY,payment_method:"mobile"});
      if(String(providerResponse.status||"").toLowerCase()!=="success") throw new Error(firstString(providerResponse.message,providerResponse.error)||"FimiPay imeshindwa kuanzisha malipo.");
      const providerData=obj(providerResponse.data); const providerOrderId=firstString(providerResponse.order_id,providerResponse.orderId,providerData.order_id,providerData.orderId,providerData.reference,providerData.transaction_id); if(!providerOrderId) throw new Error("FimiPay response haina order ID.");
      await supa(`rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,{method:"PATCH",body:JSON.stringify({payment_provider:"fimipay",payment_order_id:providerOrderId,payment_response:providerResponse,status:"payment_processing"})});
      return send(res,{ok:true,orderId:order.id,paymentOrderId:providerOrderId,status:"processing",message:"Push imetumwa. Thibitisha malipo kwenye simu yako."});
    }

    if(action==="status") {
      const orderId=String(b.orderId||""); if(!orderId) throw new Error("orderId inahitajika.");
      const orders=await supa(`rest/v1/orders?id=eq.${encodeURIComponent(orderId)}&user_id=eq.${encodeURIComponent(user.id)}&select=*`); const order=orders?.[0]; if(!order) throw new Error("Oda haipatikani.");
      if(order.payment_status==="paid") return send(res,{ok:true,paid:true,status:"success",order});
      const p=await provider(STATUS_URL,{order_id:order.payment_order_id}); const ps=statusOf(p)||"pending";
      if(ps==="success") { await supa(`rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,{method:"PATCH",body:JSON.stringify({payment_status:"paid",status:"paid",payment_response:p,paid_at:new Date().toISOString()})}); return send(res,{ok:true,paid:true,status:ps,order:{...order,payment_status:"paid",status:"paid"}}); }
      const next=failed(ps)?"failed":"processing"; await supa(`rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,{method:"PATCH",body:JSON.stringify({payment_status:next,status:`payment_${next}`,payment_response:p})}); return send(res,{ok:true,paid:false,status:ps,order:{...order,payment_status:next}});
    }
    throw new Error("Unknown action");
  } catch(error) { console.error("SMART SOKO FimiPay error",error); return send(res,{ok:false,error:error instanceof Error?error.message:"Payment error"},400); }
}
