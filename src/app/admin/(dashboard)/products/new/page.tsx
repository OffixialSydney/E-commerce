import type { Metadata } from "next";
import { getAllCategoriesAdmin } from "@/lib/data/admin-categories";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Add Product" };

export default async function NewProductPage() {
  const categories = await getAllCategoriesAdmin();

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Add Product</h1>
      <p className="mt-1 text-sm text-navy/60">
        Create the product first, then upload images on the next screen.
      </p>
      <div className="mt-6 max-w-3xl">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
