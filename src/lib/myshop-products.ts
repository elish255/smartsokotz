import catalog from "@/data/myshop-products.json";
import type { ShopifyProduct } from "@/lib/shopify";

export function getMyshopProducts(): ShopifyProduct[] {
  return catalog.map((item) => {
    const amount = String(item.price);
    const variantId = `myshop:${item.id}`;
    return {
      node: {
        id: variantId,
        title: item.title,
        description: item.description,
        handle: `myshop-${item.handle}`,
        productType: item.category,
        vendor: "SMART SOKO",
        tags: ["myshop", "smart-soko"],
        priceRange: { minVariantPrice: { amount, currencyCode: item.currency } },
        images: { edges: item.image ? [{ node: { url: item.image, altText: item.title } }] : [] },
        variants: {
          edges: [{
            node: {
              id: variantId,
              title: "Default",
              price: { amount, currencyCode: item.currency },
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


export function getMyshopProductByHandle(handle: string): ShopifyProduct | null {
  return getMyshopProducts().find((product) => product.node.handle === handle) ?? null;
}
