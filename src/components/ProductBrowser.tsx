import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/components/ProductGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 8;

export function ProductBrowser() {
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useProducts();

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    const list = data ?? [];
    if (!q) return list;
    return list.filter((p) =>
      `${p.node.title} ${p.node.vendor ?? ""} ${p.node.productType ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [data, term]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <div className="sticky top-[68px] z-30 -mx-4 mb-6 bg-background/95 px-4 py-3 backdrop-blur md:top-[100px]">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 shadow-card">
          <Search className="h-4 w-4 flex-shrink-0 text-brand" />
          <Input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Tafuta bidhaa..."
            aria-label="Tafuta bidhaa"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Imeshindikana kupakia bidhaa. Jaribu tena.
        </p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-display text-lg font-semibold">No products found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Hakuna bidhaa inayolingana na utafutaji wako.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Kurasa">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  onClick={() => setPage(n)}
                  aria-current={n === current ? "page" : undefined}
                  className={
                    n === current
                      ? "h-11 w-11 rounded-xl bg-brand text-brand-foreground hover:bg-brand/90"
                      : "h-11 w-11 rounded-xl border border-border bg-card text-foreground hover:bg-secondary"
                  }
                >
                  {n}
                </Button>
              ))}
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={current === totalPages}
                aria-label="Ukurasa unaofuata"
                className="h-11 w-11 rounded-xl border border-border bg-card text-foreground hover:bg-secondary"
              >
                ›
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
