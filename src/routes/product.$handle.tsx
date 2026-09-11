import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { fetchProductByHandle, formatPrice } from "@/lib/shopify";

export const Route = createFileRoute("/product/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle.replace(/-/g, " ")} | SMART SOKO` },
      {
        name: "description",
        content:
          "Maelezo kamili ya bidhaa, bei na upatikanaji SMART SOKO — elektroniki na vifaa vya nyumbani Tanzania.",
      },
      { property: "og:title", content: `${params.handle.replace(/-/g, " ")} | SMART SOKO` },
      {
        property: "og:description",
        content: "Nunua bidhaa hii SMART SOKO kwa bei nafuu na usafirishaji wa haraka.",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["product", handle],
    queryFn: () => fetchProductByHandle(handle),
  });
  const addItem = useCartStore((state) => state.addItem);
  const isAdding = useCartStore((state) => state.isLoading);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="font-display text-lg font-semibold">Bidhaa haipatikani</p>
        <Link to="/bidhaa" className="mt-3 inline-block text-sm text-brand hover:underline">
          Rudi kwenye bidhaa
        </Link>
      </div>
    );
  }

  const node = data.node;
  const variants = node.variants.edges.map((v) => v.node);
  const selected = variants.find((v) => v.id === variantId) ?? variants[0];
  const images = node.images.edges.map((i) => i.node);
  const image = images[imageIndex] ?? images[0];

  const handleAddToCart = async () => {
    if (!selected) return;
    await addItem({
      product: data,
      variantId: selected.id,
      variantTitle: selected.title,
      price: selected.price,
      quantity: 1,
      selectedOptions: selected.selectedOptions || [],
    });
    toast.success("Imeongezwa kikapuni", { description: node.title });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        to="/bidhaa"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Bidhaa zote
      </Link>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-lg border border-border bg-secondary">
            {image ? (
              <img
                src={image.url}
                alt={image.altText ?? node.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Hakuna picha
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.url}
                  onClick={() => setImageIndex(i)}
                  className={`h-16 w-16 overflow-hidden rounded-md border ${
                    i === imageIndex ? "border-brand" : "border-border"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.altText ?? node.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">{node.title}</h1>
          <p className="mt-3 font-display text-2xl font-bold text-brand">
            {selected
              ? formatPrice(selected.price.amount, selected.price.currencyCode)
              : formatPrice(
                  node.priceRange.minVariantPrice.amount,
                  node.priceRange.minVariantPrice.currencyCode,
                )}
          </p>
          <p className="mt-4 text-sm whitespace-pre-line text-muted-foreground">
            {node.description}
          </p>

          {variants.length > 1 && (
            <div className="mt-6">
              <h2 className="text-sm font-medium">Chagua aina</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setVariantId(variant.id)}
                    disabled={!variant.availableForSale}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-40 ${
                      selected?.id === variant.id
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {variant.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleAddToCart}
            disabled={isAdding || !selected?.availableForSale}
            size="lg"
            className="mt-8 w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {selected?.availableForSale ? "Weka kikapuni" : "Imeisha"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}