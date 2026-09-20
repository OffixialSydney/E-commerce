"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2, Upload } from "lucide-react";
import {
  uploadProductImage,
  deleteProductImage,
  setPrimaryImage,
} from "@/lib/actions/admin/products";
import { productImageUrl } from "@/lib/utils/image-url";
import type { ProductImage } from "@/types/database";

export function ProductImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadProductImage(productId, formData);

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!result.success) {
      setError(result.error ?? "Upload failed.");
      return;
    }
    router.refresh();
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Remove this image?")) return;
    await deleteProductImage(imageId, productId);
    router.refresh();
  }

  async function handleSetPrimary(imageId: string) {
    await setPrimaryImage(imageId, productId);
    router.refresh();
  }

  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-6">
      <p className="text-sm font-medium text-navy">Product images</p>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {sorted.map((image) => (
          <div key={image.id} className="group relative aspect-square overflow-hidden rounded-xl bg-navy/5">
            <Image
              src={productImageUrl(image.storage_path)}
              alt=""
              fill
              sizes="150px"
              className="object-cover"
            />
            {image.is_primary && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-gold px-2 py-0.5 text-[10px] font-medium text-navy">
                Primary
              </span>
            )}
            <div className="absolute inset-0 flex items-end justify-end gap-1 bg-navy/0 p-1.5 opacity-0 transition-opacity group-hover:bg-navy/30 group-hover:opacity-100">
              {!image.is_primary && (
                <button
                  onClick={() => handleSetPrimary(image.id)}
                  className="rounded-lg bg-white p-1.5 text-navy hover:bg-gold"
                  title="Set as primary"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => handleDelete(image.id)}
                className="rounded-lg bg-white p-1.5 text-red-600 hover:bg-red-50"
                title="Remove image"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-navy/20 text-navy/50 hover:border-gold hover:text-gold-dark">
          <Upload className="h-5 w-5" />
          <span className="text-xs">{isUploading ? "Uploading…" : "Add image"}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
