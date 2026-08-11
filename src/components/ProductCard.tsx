import { Link } from "@tanstack/react-router";
import { ChevronRight, Loader2, ShoppingCart } from "lucide-react";
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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-lift">
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
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        {node.vendor ? (
          <p className="text-[11px] font-bold tracking-wide text-brand uppercase">{node.vendor}</p>
        ) : null}
        <Link to="/product/$handle" params={{ handle: node.handle }}>
          <h3 className="line-clamp-1 font-display text-sm font-semibold">{node.title}</h3>
        </Link>
        <p className="mt-auto pt-1 font-display text-lg font-bold text-brand">
          {formatPrice(
            node.priceRange.minVariantPrice.amount,
            node.priceRange.minVariantPrice.currencyCode,
          )}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Button
            onClick={handleAddToCart}
            disabled={isLoading || !variant || !variant.availableForSale}
            variant="secondary"
            size="icon"
            aria-label="Weka kikapuni"
            className="h-10 w-12 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>
          <Button
            asChild
            className="h-10 flex-1 rounded-xl bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <Link to="/product/$handle" params={{ handle: node.handle }}>
              Angalia <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}