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
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product not found" };

  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0];

  return {
    title: product.name,
    description: product.description ?? `${product.name} — available now at Sid Bespoke.`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: primaryImage ? [productImageUrl(primaryImage.storage_path)] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getStoreSettings(),
  ]);

  if (!product) notFound();

  const reviews = await getProductReviews(product.id);
  const { average, count } = getReviewSummary(reviews);

  const discount = discountPercent(product.price, product.previous_price);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    sku: product.sku ?? undefined,
    image: (product.images ?? []).map((img) => productImageUrl(img.storage_path)),
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: "NGN",
      price: product.price,
      availability:
        product.stock_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <ProductGallery images={product.images ?? []} productName={product.name} />

        <div>
          {product.category && (
            <p className="text-sm text-navy/50">{product.category.name}</p>
          )}
          <h1 className="mt-1 font-display text-3xl text-navy">{product.name}</h1>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-semibold text-navy">
              {formatNaira(product.price)}
            </span>
            {product.previous_price && product.previous_price > product.price && (
              <>
                <span className="text-base text-navy/40 line-through">
                  {formatNaira(product.previous_price)}
                </span>
                {discount && (
                  <span className="rounded-full bg-navy/5 px-2.5 py-1 text-xs font-medium text-navy">
                    -{discount}%
                  </span>
                )}
              </>
            )}
          </div>

          {product.description && (
            <p className="mt-5 leading-relaxed text-navy/70">{product.description}</p>
          )}

          <div className="mt-8">
            <AddToCartControls product={product} whatsappNumber={settings.whatsapp_number} />
          </div>
        </div>
      </div>
    </main>
  );
}
