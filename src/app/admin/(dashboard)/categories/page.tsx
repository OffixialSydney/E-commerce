import type { Metadata } from "next";
import { getAllCategoriesAdmin } from "@/lib/data/admin-categories";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await getAllCategoriesAdmin();

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Categories</h1>
      <p className="mt-1 text-sm text-navy/60">{categories.length} total</p>
      <div className="mt-6">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
