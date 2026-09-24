"use server";

import { revalidatePath } from "next/cache";
import { submitReview } from "@/lib/data/reviews";

export async function submitReviewAction(formData: FormData) {
  const product_id = formData.get("product_id") as string;
  const product_slug = formData.get("product_slug") as string;
  const customer_name = (formData.get("customer_name") as string)?.trim();
  const rating = Number(formData.get("rating"));
  const comment = (formData.get("comment") as string)?.trim();

  if (!product_id || !customer_name || !rating) {
    return { success: false, error: "Please fill in your name and a rating." };
  }

  const result = await submitReview({
    product_id,
    customer_name,
    rating,
    comment,
  });

  if (result.success && product_slug) {
    revalidatePath(`/product/${product_slug}`);
  }

  return result;
}
