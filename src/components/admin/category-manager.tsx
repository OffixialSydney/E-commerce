"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryFormValues,
} from "@/lib/actions/admin/categories";
import type { Category } from "@/types/database";

const emptyForm: CategoryFormValues = {
  name: "",
  description: "",
  display_order: 0,
  is_active: true,
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryFormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function startEdit(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description ?? "",
      display_order: category.display_order,
      is_active: category.is_active,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const result = editingId ? await updateCategory(editingId, form) : await createCategory(form);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    cancelEdit();
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Products in it will become uncategorized.")) return;
    await deleteCategory(id);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-xs text-navy/50">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-navy/5 last:border-0">
                <td className="px-4 py-3">
                  <button onClick={() => startEdit(cat)} className="font-medium text-navy hover:underline">
                    {cat.name}
                  </button>
                </td>
                <td className="px-4 py-3 text-navy/60">{cat.display_order}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      cat.is_active ? "bg-green-50 text-green-700" : "bg-navy/5 text-navy/50"
                    }`}
                  >
                    {cat.is_active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-navy/50">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="h-fit space-y-3 rounded-2xl border border-navy/10 bg-white p-5">
        <p className="text-sm font-medium text-navy">{editingId ? "Edit category" : "Add category"}</p>

        <label className="block">
          <span className="mb-1.5 block text-xs text-navy/60">Name</span>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-navy/60">Description (optional)</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="input min-h-[70px] resize-none"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs text-navy/60">Display order</span>
          <input
            type="number"
            value={form.display_order}
            onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
            className="input"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-navy/80">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="h-4 w-4 rounded border-navy/30 text-gold focus:ring-gold"
          />
          Active
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 disabled:opacity-60">
            {isSubmitting ? "Saving…" : editingId ? "Save" : "Add"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
