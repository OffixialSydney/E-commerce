import type { Metadata } from "next";
import { getProducts } from "@/lib/data/products";
import { getCategories } from "@/lib/data/categories";
import { ProductCard } from "@/components/product/product-card";
import { ShopFilters } from "@/components/shop/shop-filters";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse clothing, shoes, bags, accessories, watches and beauty at Sid Bespoke.",
};

type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; filter?: string }>;
}) {
  const params = await searchParams;

  const [products, categories] = await Promise.all([
    getProducts({
      search: params.q,
      categorySlug: params.category,
      sort: (params.sort as SortOption) ?? "newest",
    }),
    getCategories(),
  ]);

  // "New arrivals" / "Best sellers" quick links from the homepage land here
  // with ?filter=new / ?filter=best — apply as a client-independent filter.
  const filtered =
    params.filter === "new"
      ? products.filter((p) => p.is_new_arrival)
      : params.filter === "best"
      ? products.filter((p) => p.is_best_seller)
      : products;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl text-navy">Shop</h1>
      <p className="mt-2 text-navy/60">
        {filtered.length} {filtered.length === 1 ? "product" : "products"}
      </p>

      <div className="mt-6">
        <ShopFilters categories={categories} />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy/15 py-20 text-center">
          <p className="text-lg font-medium text-navy">No products found</p>
          <p className="mt-2 max-w-sm text-sm text-navy/60">
            Try a different search term or clear your filters to see the full
            catalogue.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
