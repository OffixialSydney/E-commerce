// Hand-written types matching supabase/schema.sql.
// Once you have a live Supabase project, you can regenerate this file
// exactly with:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
// Regenerating is recommended once real tables exist, but this file is
// enough to build against in the meantime.

export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "payment_verification"
  | "payment_confirmed"
  | "processing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "card" | "bank_transfer";

export type PaymentStatus =
  | "pending"
  | "awaiting_verification"
  | "confirmed"
  | "failed"
  | "rejected";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  previous_price: number | null;
  category_id: string | null;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_active: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  whatsapp_number: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  full_name: string;
  phone: string;
  whatsapp_number: string | null;
  email: string | null;
  delivery_address: string;
  city: string;
  state: string;
  delivery_instructions: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  access_code: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  reference: string | null;
  provider: string | null;
  paid_at: string | null;
  raw_response: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentProof {
  id: string;
  order_id: string;
  payment_id: string | null;
  storage_path: string;
  uploaded_at: string;
  reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  decision: "confirmed" | "rejected" | null;
}

export interface Message {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  whatsapp_number: string;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  delivery_fee: number;
  delivery_timeframe: string;
  contact_email: string | null;
  contact_phone: string | null;
  updated_at: string;
}

export interface AdminProfile {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
}



// Minimal Database generic shape so @supabase/ssr's typed client compiles.
// Expand with Row/Insert/Update variants per table as the app grows, or
// swap this whole file for the CLI-generated version once you have a
// live project.
export interface Database {
  public: {
    Tables: {
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> };
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> };
      product_images: { Row: ProductImage; Insert: Partial<ProductImage>; Update: Partial<ProductImage> };
      customers: { Row: Customer; Insert: Partial<Customer>; Update: Partial<Customer> };
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> };
      order_items: { Row: OrderItem; Insert: Partial<OrderItem>; Update: Partial<OrderItem> };
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment> };
      payment_proofs: { Row: PaymentProof; Insert: Partial<PaymentProof>; Update: Partial<PaymentProof> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      store_settings: { Row: StoreSettings; Insert: Partial<StoreSettings>; Update: Partial<StoreSettings> };
      admin_profiles: { Row: AdminProfile; Insert: Partial<AdminProfile>; Update: Partial<AdminProfile> };
    };
  };
}

// Convenience type: a product joined with its images and category,
// as used throughout the shop UI.
export interface ProductWithRelations extends Product {
  category: Category | null;
  images: ProductImage[];
}

// Cart item shape kept in localStorage (guest cart)
export interface CartItem {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  image_path: string | null;
  quantity: number;
  stock_quantity: number; // snapshot, re-validated server-side at checkout
}
