import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle } from "lucide-react";
import { getAllProductsAdmin } from "@/lib/data/admin-products";
import { formatNaira } from "@/lib/utils/currency";
import { productImageUrl } from "@/lib/utils/image-url";
import { ProductRowActions } from "@/components/admin/product-row-actions";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await getAllProductsAdmin(q);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-navy">Products</h1>
          <p className="mt-1 text-sm text-navy/60">{products.length} total</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary gap-2">
          <PlusCircle className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <form className="mt-6 max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search products"
          className="input"
        />
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-xs text-navy/50">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0];
              const lowStock = product.stock_quantity <= product.low_stock_threshold;
              return (
                <tr key={product.id} className="border-b border-navy/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-navy/5">
                        <Image
                          src={productImageUrl(primaryImage?.storage_path)}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <span className="font-medium text-navy hover:underline">{product.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-navy/60">{product.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-navy/70">{formatNaira(product.price)}</td>
                  <td className="px-4 py-3">
                    <span className={lowStock ? "font-medium text-red-600" : "text-navy/70"}>
                      {product.stock_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        product.is_active ? "bg-green-50 text-green-700" : "bg-navy/5 text-navy/50"
                      }`}
                    >
                      {product.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ProductRowActions productId={product.id} isActive={product.is_active} />
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-navy/50">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
