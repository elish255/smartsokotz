import { Link } from "@tanstack/react-router";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice, type ShopifyProduct } from "@/lib/shopify";

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const addItem = useCartStore((state) => state.addItem);
  const isLoading = useCartStore((state) => state.isLoading);
  const node = product.node;
  const variant = node.variants.edges.find((v) => v.node.availableForSale)?.node
    ?? node.variants.edges[0]?.node;
  const image = node.images.edges[0]?.node;

  const handleAddToCart = async () => {
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success("Imeongezwa kikapuni", { description: node.title });
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-shadow hover:shadow-lift">
      <Link
        to="/product/$handle"
        params={{ handle: node.handle }}
        className="block aspect-square overflow-hidden bg-secondary"
      >
        {image ? (
          <img
            src={image.url}
            alt={image.altText ?? node.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Hakuna picha
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to="/product/$handle" params={{ handle: node.handle }}>
          <h3 className="line-clamp-2 font-display text-sm font-semibold">{node.title}</h3>
        </Link>
        <p className="line-clamp-2 text-xs text-muted-foreground">{node.description}</p>
        <p className="mt-auto font-display text-lg font-bold text-brand">
          {formatPrice(
            node.priceRange.minVariantPrice.amount,
            node.priceRange.minVariantPrice.currencyCode,
          )}
        </p>
        <Button
          onClick={handleAddToCart}
          disabled={isLoading || !variant || !variant.availableForSale}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {variant?.availableForSale ? "Weka kikapuni" : "Imeisha"}
            </>
          )}
        </Button>
      </div>
    </article>
  );
}