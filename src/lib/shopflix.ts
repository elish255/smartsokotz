import seed from "@/data/shopflix-accessories.json";
import type { ShopifyProduct } from "@/lib/shopify";

export type ShopflixCatalogItem = {
  title: string;
  price: number;
  currency: string;
  sourceUrl?: string;
  sourcePage?: number;
};

export function slugifyShopflix(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function getShopflixProducts(): ShopifyProduct[] {
  return (seed as ShopflixCatalogItem[]).map((item, index) => {
    const handle = `shopflix-${slugifyShopflix(item.title)}`;
    const amount = String(item.price);
    const variantId = `shopflix:${index + 1}:${handle}`;
    return {
      node: {
        id: variantId,
        title: item.title,
        description: `Bidhaa ya Mobile Phone Accessories iliyoingizwa kwenye katalogi ya SMART SOKO kutoka Shopflix.`,
        handle,
        productType: "Mobile Phone Accessories",
        vendor: "Shopflix Catalog",
        tags: ["shopflix", "mobile-phone-accessories"],
        priceRange: { minVariantPrice: { amount, currencyCode: item.currency || "TZS" } },
        images: { edges: [{ node: { url: "/hero-electronics.jpg", altText: item.title } }] },
        variants: {
          edges: [{
            node: {
              id: variantId,
              title: "Default",
              price: { amount, currencyCode: item.currency || "TZS" },
              availableForSale: true,
              selectedOptions: [],
            },
          }],
        },
        options: [],
      },
    } satisfies ShopifyProduct;
  });
}

export function getShopflixProductByHandle(handle: string): ShopifyProduct | null {
  return getShopflixProducts().find((product) => product.node.handle === handle) ?? null;
}
