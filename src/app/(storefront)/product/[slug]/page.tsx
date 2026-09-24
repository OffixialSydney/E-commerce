import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/settings";
import { ProductGallery } from "@/components/product/product-gallery";
import { AddToCartControls } from "@/components/product/add-to-cart-controls";
import { formatNaira, discountPercent } from "@/lib/utils/currency";
import { productImageUrl } from "@/lib/utils/image-url";
import { getProductReviews, getReviewSummary } from "@/lib/data/reviews";
import { ReviewStars } from "@/components/product/review-stars";
import { ReviewsSection } from "@/components/product/reviews-section";

interface ProductPageProps {
  params: Promise
