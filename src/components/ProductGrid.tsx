import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { getShopflixProducts } from "@/lib/shopflix";
import { getMyshopProducts } from "@/lib/myshop-products";

export function useProducts(search?: string) {
  return useQuery({
    queryKey: ["products", search ?? ""],
    queryFn: async () => {
      // The store's imported catalog is local. Do not call Shopify directly from
      // the browser: Shopify's CORS/preflight response was failing on this domain.
      const combined = [...getMyshopProducts(), ...getShopflixProducts()];
      const unique = Array.from(
        new Map(combined.map((product) => [product.node.id, product])).values(),
      );
      const q = search?.trim().toLowerCase();
      if (!q) return unique;
      return unique.filter((product) =>
        `${product.node.title} ${product.node.vendor ?? ""} ${product.node.productType ?? ""}`
          .toLowerCase()
          .includes(q),
      );
    },
  });
}

export function ProductGrid({ search }: { search?: string }) {
  const { data, isLoading, isError } = useProducts(search);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Imeshindikana kupakia bidhaa. Jaribu tena.
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-16 text-center">
        <p className="font-display text-lg font-semibold">No products found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Bado hakuna bidhaa dukani. Niambie jina la bidhaa na bei yake ili niiongeze.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {data.map((product) => (
        <ProductCard key={product.node.id} product={product} />
      ))}
    </div>
  );
}