import type { Metadata } from "next";
import Link from "next/link";
import { Package, AlertTriangle, ShoppingCart, Clock, CreditCard, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

async function getStats() {
  const supabase = await createClient();

  const [
    { count: totalProducts },
    { count: pendingOrders },
    { count: pendingPayments },
    { count: completedOrders },
    { data: lowStockProducts },
    { count: totalOrders },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("order_status", ["pending", "payment_pending", "payment_verification", "processing"]),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("payment_status", ["pending", "awaiting_verification"]),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "delivered"),
    supabase.from("products").select("id, stock_quantity, low_stock_threshold"),
    supabase.from("orders").select("*", { count: "exact", head: true }),
  ]);

  const lowStockCount =
    lowStockProducts?.filter((p: any) => p.stock_quantity <= p.low_stock_threshold).length ?? 0;

  return {
    totalProducts: totalProducts ?? 0,
    lowStockCount,
    totalOrders: totalOrders ?? 0,
    pendingOrders: pendingOrders ?? 0,
    pendingPayments: pendingPayments ?? 0,
    completedOrders: completedOrders ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total Products", value: stats.totalProducts, icon: Package, href: "/admin/products" },
    {
      label: "Low Stock",
      value: stats.lowStockCount,
      icon: AlertTriangle,
      href: "/admin/products",
      warn: stats.lowStockCount > 0,
    },
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, href: "/admin/orders" },
    { label: "Pending Orders", value: stats.pendingOrders, icon: Clock, href: "/admin/orders" },
    {
      label: "Pending Payments",
      value: stats.pendingPayments,
      icon: CreditCard,
      href: "/admin/payments",
      warn: stats.pendingPayments > 0,
    },
    { label: "Completed Orders", value: stats.completedOrders, icon: CheckCircle2, href: "/admin/orders" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-navy">Dashboard</h1>
      <p className="mt-1 text-sm text-navy/60">An overview of your store right now.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-2xl border p-5 transition-shadow hover:shadow-card ${
              card.warn ? "border-gold/50 bg-gold/5" : "border-navy/10 bg-white"
            }`}
          >
            <card.icon className={`h-5 w-5 ${card.warn ? "text-gold-dark" : "text-navy/40"}`} />
            <p className="mt-3 text-2xl font-semibold text-navy">{card.value}</p>
            <p className="mt-1 text-sm text-navy/60">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
