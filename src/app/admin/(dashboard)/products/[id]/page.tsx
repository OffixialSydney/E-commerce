import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductByIdAdmin } from "@/lib/data/admin-products";
import { getAllCategoriesAdmin } from "@/lib/data/admin-categories";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImageManager } from "@/components/admin/product-image-manager";

export const metadata: Metadata = { title: "Edit Product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductByIdAdmin(id),
    getAllCategoriesAdmin(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-navy/50 hover:text-navy">
        ← Back to Products
      </Link>
      <h1 className="mt-2 font-display text-2xl text-navy">{product.name}</h1>

      <div className="mt-6 max-w-3xl space-y-6">
        <ProductImageManager productId={product.id} images={product.images ?? []} />
        <ProductForm categories={categories} product={product} />
      </div>
    </div>
  );
}
