import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/types/database";

/**
 * Fetch approved reviews for a single product, newest first.
 * Public-facing — RLS only returns rows where is_approved = true.
 */
export async function getProductReviews(productId: string): Promise<Review[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProductReviews error:", error.message);
    return [];
  }

  return (data ?? []) as Review[];
}

/**
 * Compute average rating + count from an already-fetched review list.
 * Kept as a pure helper so it can run on data from getProductReviews
 * without an extra round trip to Supabase.
 */
export function getReviewSummary(reviews: Review[]) {
  const count = reviews.length;
  if (count === 0) return { average: 0, count: 0 };

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { average: Math.round((total / count) * 10) / 10, count };
}

/**
 * Submit a new review for a product. Goes in as unapproved
 * (is_approved defaults to false) until an admin approves it.
 */
export async function submitReview(input: {
  product_id: string;
  customer_name: string;
  rating: number;
  comment?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("reviews").insert({
    product_id: input.product_id,
    customer_name: input.customer_name,
    rating: input.rating,
    comment: input.comment || null,
  });

  if (error) {
    console.error("submitReview error:", error.message);
    return { success: false, error: "Could not submit review. Please try again." };
  }

  return { success: true };
}
