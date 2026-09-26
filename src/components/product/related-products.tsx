import { ProductCard } from "@/components/product/product-card";
import type { ProductWithRelations } from "@/types/database";

export function RelatedProducts({ products }: { products: ProductWithRelations[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-16 border-t border-navy/10 pt-10">
      <h2 className="font-display text-2xl text-navy">You May Also Like</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}