import type { CartItem } from "@/stores/cartStore";

const KEY = "smart-soko-pending-cart-item";

export function savePendingCartItem(item: Omit<CartItem, "lineId">) {
  try {
    localStorage.setItem(KEY, JSON.stringify(item));
  } catch (error) {
    console.error("Failed to save pending cart item", error);
  }
}

export function readPendingCartItem(): Omit<CartItem, "lineId"> | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Omit<CartItem, "lineId">;
  } catch (error) {
    console.error("Failed to read pending cart item", error);
    return null;
  }
}

export function clearPendingCartItem() {
  try { localStorage.removeItem(KEY); } catch {}
}
