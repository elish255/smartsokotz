import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductGrid } from "@/components/ProductGrid";

export const Route = createFileRoute("/bidhaa")({
  head: () => ({
    meta: [
      { title: "Bidhaa Zote | SMART SOKO" },
      {
        name: "description",
        content:
          "Tazama bidhaa zote za SMART SOKO: simu, laptop, TV, spika na vifaa vya nyumbani kwa bei nafuu Tanzania.",
      },
      { property: "og:title", content: "Bidhaa Zote | SMART SOKO" },
      {
        property: "og:description",
        content: "Kolekshemu kamili ya elektroniki na vifaa vya nyumbani SMART SOKO.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Bidhaa Zote</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tafuta bidhaa unayohitaji kutoka kwenye duka letu.
      </p>
      <div className="relative mt-6 mb-8 max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tafuta bidhaa..."
          className="pl-9"
        />
      </div>
      <ProductGrid search={search.trim()} />
    </div>
  );
}