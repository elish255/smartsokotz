import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts } from "@/lib/shopify";
import { getShopflixProducts } from "@/lib/shopflix";

export function useProducts(search?: string) {
  return useQuery({
    queryKey: ["products", search ?? ""],
    queryFn: async () => {
      const [shopifyProducts, shopflixProducts] = await Promise.all([
        fetchProducts(50, search || undefined),
        Promise.resolve(getShopflixProducts()),
      ]);
      const local = search
        ? shopflixProducts.filter((p) => `${p.node.title} ${p.node.vendor ?? ""} ${p.node.productType ?? ""}`.toLowerCase().includes(search.toLowerCase()))
        : shopflixProducts;
      return [...shopifyProducts, ...local];
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