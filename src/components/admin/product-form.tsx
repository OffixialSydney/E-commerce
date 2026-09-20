"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, type ProductFormValues } from "@/lib/actions/admin/products";
import type { Category, ProductWithRelations } from "@/types/database";

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: ProductWithRelations;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    previous_price: product?.previous_price ?? null,
    category_id: product?.category_id ?? null,
    sku: product?.sku ?? null,
    stock_quantity: product?.stock_quantity ?? 0,
    low_stock_threshold: product?.low_stock_threshold ?? 5,
    is_featured: product?.is_featured ?? false,
    is_new_arrival: product?.is_new_arrival ?? false,
    is_best_seller: product?.is_best_seller ?? false,
    is_active: product?.is_active ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!values.name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (values.price <= 0) {
      setError("Price must be greater than zero.");
      return;
    }

    setIsSubmitting(true);
    const result = product
      ? await updateProduct(product.id, values)
      : await createProduct(values);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    if (!product && result.id) {
      router.push(`/admin/products/${result.id}`);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-navy/10 bg-white p-6 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm text-navy/70">Product name</span>
          <input
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            className="input"
            required
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm text-navy/70">Description</span>
          <textarea
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            className="input min-h-[100px] resize-none"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-navy/70">Price (₦)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={values.price}
            onChange={(e) => update("price", Number(e.target.value))}
            className="input"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-navy/70">Previous price (optional)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={values.previous_price ?? ""}
            onChange={(e) => update("previous_price", e.target.value ? Number(e.target.value) : null)}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-navy/70">Category</span>
          <select
            value={values.category_id ?? ""}
            onChange={(e) => update("category_id", e.target.value || null)}
            className="input"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-navy/70">SKU (optional)</span>
          <input
            value={values.sku ?? ""}
            onChange={(e) => update("sku", e.target.value || null)}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-navy/70">Stock quantity</span>
          <input
            type="number"
            min={0}
            value={values.stock_quantity}
            onChange={(e) => update("stock_quantity", Number(e.target.value))}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-navy/70">Low stock threshold</span>
          <input
            type="number"
            min={0}
            value={values.low_stock_threshold}
            onChange={(e) => update("low_stock_threshold", Number(e.target.value))}
            className="input"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-navy/10 bg-white p-6">
        <p className="text-sm font-medium text-navy">Flags</p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Checkbox label="Featured" checked={values.is_featured} onChange={(v) => update("is_featured", v)} />
          <Checkbox
            label="New arrival"
            checked={values.is_new_arrival}
            onChange={(v) => update("is_new_arrival", v)}
          />
          <Checkbox
            label="Best seller"
            checked={values.is_best_seller}
            onChange={(v) => update("is_best_seller", v)}
          />
          <Checkbox label="Active (visible in shop)" checked={values.is_active} onChange={(v) => update("is_active", v)} />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
        {isSubmitting ? "Saving…" : product ? "Save Changes" : "Create Product"}
      </button>
    </form>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-navy/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-navy/30 text-gold focus:ring-gold"
      />
      {label}
    </label>
  );
}
