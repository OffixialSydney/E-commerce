import Link from "next/link";
import { Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { getFeaturedProducts, getNewArrivals, getBestSellers } from "@/lib/data/products";
import { getCategories } from "@/lib/data/categories";
import { getStoreSettings } from "@/lib/data/settings";
import { ProductCard } from "@/components/product/product-card";
import { CategoryCard } from "@/components/product/category-card";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { HeroSlideshow } from "@/components/layout/hero-slideshow";


export default async function HomePage() {
  const [featured, newArrivals, bestSellers, categories, settings] = await Promise.all([
    getFeaturedProducts(8),
    getNewArrivals(4),
    getBestSellers(4),
    getCategories(),
    getStoreSettings(),
  ]);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-8">
          <div>
            <h1 className="font-display text-4xl leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Style Made Personal.
            </h1>
            <p className="mt-5 max-w-md text-base text-white/70 sm:text-lg">
              Discover carefully selected pieces designed to elevate your
              everyday style.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary bg-gold text-navy hover:bg-gold-light">
                Shop Now
              </Link>
              <a
                href={buildWhatsAppLink(settings.whatsapp_number)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

        <HeroSlideshow />

        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-2xl text-navy sm:text-3xl">Featured</h2>
            <Link href="/shop" className="text-sm font-medium text-navy/60 hover:text-navy">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Shop by category */}
      {categories.length > 0 && (
        <section className="bg-navy/[0.03] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 font-display text-2xl text-navy sm:text-3xl">
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
              {categories.slice(0, 8).map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-2xl text-navy sm:text-3xl">New Arrivals</h2>
            <Link href="/shop?filter=new" className="text-sm font-medium text-navy/60 hover:text-navy">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section className="bg-navy/[0.03] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-display text-2xl text-navy sm:text-3xl">Best Sellers</h2>
              <Link href="/shop?filter=best" className="text-sm font-medium text-navy/60 hover:text-navy">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Promotional banner */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-navy px-8 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-display text-2xl text-white">
              Free delivery on qualifying orders
            </p>
            <p className="mt-2 text-white/60">
              Ordered often? Reach out on WhatsApp for current promotions and
              early access to new drops.
            </p>
          </div>
          <a
            href={buildWhatsAppLink(settings.whatsapp_number, {
              note: "Hi, I'd like to know about current promotions.",
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary shrink-0 bg-gold text-navy hover:bg-gold-light"
          >
            Ask on WhatsApp
          </a>
        </div>
      </section>

      {/* Why shop with us */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center font-display text-2xl text-navy sm:text-3xl">
          Why Shop with Sid Bespoke
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="text-center">
            <Truck className="mx-auto h-8 w-8 text-gold-dark" />
            <p className="mt-4 font-medium text-navy">{settings.delivery_timeframe}</p>
          </div>
          <div className="text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-gold-dark" />
            <p className="mt-4 font-medium text-navy">
              Secure card payments, verified bank transfers
            </p>
          </div>
          <div className="text-center">
            <RotateCcw className="mx-auto h-8 w-8 text-gold-dark" />
            <p className="mt-4 font-medium text-navy">
              Real support on WhatsApp, before and after you order
            </p>
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-navy/10 bg-white px-8 py-10 text-center shadow-card">
          <p className="font-display text-xl text-navy sm:text-2xl">
            Have a question before you order?
          </p>
          <a
            href={buildWhatsAppLink(settings.whatsapp_number)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
          >
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
