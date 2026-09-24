import { Star } from "lucide-react";

export function ReviewStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const dimension = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${dimension} ${
            i <= rounded ? "fill-gold text-gold" : "fill-transparent text-navy/20"
          }`}
        />
      ))}
    </div>
  );
}
