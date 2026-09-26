import { CartProvider } from "@/lib/cart/cart-context";
import { WishlistProvider } from "@/lib/wishlist/wishlist-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloatButton } from "@/components/whatsapp-float-button";
import { getCategories } from "@/lib/data/categories";
import { getStoreSettings } from "@/lib/data/settings";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, settings] = await Promise.all([
    getCategories(),
    getStoreSettings(),
  ]);

  return (
    <CartProvider>
      <WishlistProvider>
        <Navbar categories={categories} whatsappNumber={settings.whatsapp_number} />
        {children}
        <Footer settings={settings} />
        <WhatsAppFloatButton whatsappNumber={settings.whatsapp_number} />
      </WishlistProvider>
    </CartProvider>
  );
}