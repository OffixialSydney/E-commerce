"use client";

import { useState, useTransition } from "react";
import { ReviewStars } from "@/components/product/review-stars";
import { submitReviewAction } from "@/lib/actions/reviews";
import type { Review } from "@/types/database";

export function ReviewsSection({
  productId,
  productSlug,
  reviews,
}: {
  productId: string;
  productSlug?: string;
  reviews: Review[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleSubmit(formData: FormData) {
    formData.set("product_id", productId);
    if (productSlug) formData.set("product_slug", productSlug);
    formData.set("rating", String(rating));

    startTransition(async () => {
      const result = await submitReviewAction(formData);
      if (result.success) {
        setStatus("success");
        setShowForm(false);
        setRating(0);
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <section className="mt-16 border-t border-navy/10 pt-10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-navy">Customer Reviews</h2>
        {!showForm && status !== "success" && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
          >
            Write a review
          </button>
        )}
      </div>

      {status === "success" && (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          Thanks! Your review has been submitted and will appear once approved.
        </p>
      )}

      {showForm && (
        <form action={handleSubmit} className="mt-6 rounded-2xl border border-navy/10 p-5">
          <div>
            <label className="text-sm font-medium text-navy">Your rating</label>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  className="p-0.5"
                  aria-label={`${i} star${i > 1 ? "s" : ""}`}
                >
                  <ReviewStars rating={i <= rating ? 5 : 0} size="md" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="customer_name" className="text-sm font-medium text-navy">
              Your name
            </label>
            <input
              id="customer_name"
              name="customer_name"
              required
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="comment" className="text-sm font-medium text-navy">
              Your review (optional)
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={3}
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          {status === "error" && (
            <p className="mt-3 text-sm text-red-600">{errorMsg}</p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={isPending || rating === 0}
              className="btn-primary bg-gold text-navy hover:bg-gold-light disabled:opacity-50"
            >
              {isPending ? "Submitting…" : "Submit review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-navy/60 hover:text-navy"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 space-y-6">
        {reviews.length === 0 ? (
          <p className="text-sm text-navy/60">No reviews yet. Be the first to share your thoughts.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-navy/10 pb-6 last:border-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-navy">{review.customer_name}</p>
                <ReviewStars rating={review.rating} />
              </div>
              {review.comment && (
                <p className="mt-2 text-sm text-navy/70">{review.comment}</p>
              )}
              <p className="mt-2 text-xs text-navy/40">
                {new Date(review.created_at).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
