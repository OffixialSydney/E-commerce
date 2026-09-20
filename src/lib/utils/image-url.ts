/**
 * Builds a public URL for a file in the `product-images` bucket.
 * storage_path is what's stored in product_images.storage_path, e.g.
 * "products/abc123/1.jpg".
 */
export function productImageUrl(storagePath: string | null | undefined): string {
  if (!storagePath) return "/placeholder-product.svg";

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "/placeholder-product.svg";

  return `${base}/storage/v1/object/public/product-images/${storagePath}`;
}
