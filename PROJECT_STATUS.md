# Sid Bespoke — Build Status

## Phase 1 — Foundation (DONE)
- [x] Supabase schema: `supabase/schema.sql` (all tables, enums, indexes, triggers)
- [x] RLS policies: `supabase/rls_policies.sql`
- [x] DB functions: `supabase/functions.sql` (order numbers, atomic stock reservation, stock restore)
- [x] Storage buckets + policies: `supabase/storage_setup.sql`
- [x] Next.js + TS + Tailwind scaffold, brand theme (navy/gold)
- [x] Supabase clients: browser (`lib/supabase/client.ts`), server (`server.ts`), service-role admin (`admin.ts`)
- [x] Auth middleware protecting `/admin/**`
- [x] Base types: `types/database.ts`
- [x] Placeholder homepage

## Phase 2 — Customer-facing storefront (DONE)
- [x] Navbar (desktop + mobile) with cart badge, WhatsApp button, category dropdown
- [x] Homepage: hero, featured, shop-by-category, new arrivals, best sellers, promo banner, why-shop, WhatsApp CTA
- [x] Shop page: grid, search, category filter, sort (newest/price/popularity), empty state
- [x] Product detail page: gallery, quantity selector, add to cart, buy now, WhatsApp enquiry, out-of-stock handling, SEO metadata
- [x] Cart: localStorage-persisted (guest), quantity controls, remove, order summary
- [x] Checkout: full form + validation (Zod). Bank transfer works end-to-end; card payment is gated with a "coming in Phase 3" message rather than faking success
- [x] Order creation server action (`src/lib/actions/orders.ts`): re-validates prices/stock server-side, atomic `reserve_stock` RPC, creates customer/order/order_items/payment, compensating stock-restore if a later step fails
- [x] Order confirmation page (order number + random access_code in the URL, so order numbers alone aren't guessable)
- [x] Order tracking page (order number + phone, no login)
- [x] Contact/enquiry page (public insert into `messages`, allowed directly by RLS)

## Phase 3 — Payments (DONE)
- [x] Paystack Standard/redirect flow: `initializePaystackPayment` (`src/lib/actions/paystack.ts`) calls `transaction/initialize`, redirects to Paystack's hosted page
- [x] `/payment/callback` verifies via `transaction/verify` server-side (never trusts the redirect alone), confirms or fails the order, offers retry
- [x] `/api/webhooks/paystack` — signature-verified webhook as the reliable source of truth, idempotent with the callback path via shared `verifyAndRecordPayment`
- [x] Checkout form fully wired for card: requires email, creates the order once, retries payment init without duplicating the order on failure
- [x] Bank transfer screenshot upload (`uploadPaymentProof` + `PaymentProofUpload`) to the private `payment-proofs` bucket, shown on the order confirmation page with upload/received/rejected states

## Phase 4 — Admin dashboard (DONE)
- [x] Restructured routing: customer-facing pages moved into a `(storefront)`
  route group with their own layout (navbar/footer/cart); the true root
  layout is now just the HTML shell, so `/admin` no longer inherits any
  storefront chrome
- [x] `/admin/login` (Supabase Auth, outside the dashboard layout/auth check)
- [x] `/admin/(dashboard)/layout.tsx` — verifies the session belongs to an
  actual `admin_profiles` row (defense in depth beyond the middleware),
  renders the sidebar shell with logout
- [x] Dashboard overview: total/low-stock products, total/pending orders,
  pending payments, completed orders
- [x] Products: list + search, add/edit form, image upload/delete/set-primary,
  enable/disable, delete, manual stock adjustment via the edit form
- [x] Categories: list + inline create/edit/delete
- [x] Orders: list with status filter, detail page (items, customer,
  delivery, payment info, WhatsApp contact), status dropdown that restores
  stock automatically when cancelled
- [x] Payments: bank-transfer verification queue with signed screenshot
  previews, confirm/reject (also available from the order detail page)
- [x] Customers: searchable list with WhatsApp contact link
- [x] Messages: inbox with read/unread state and WhatsApp reply link
- [x] Settings: store name, WhatsApp number, bank details, delivery
  fee/timeframe, contact info — all editable without touching code

## Phase 5 — Polish (DONE)
- [x] `src/app/sitemap.ts` — dynamic sitemap covering static routes, active
  products, and active categories
- [x] `src/app/robots.ts` — disallows `/admin`, `/api`, `/cart`, `/checkout`,
  `/payment/callback`
- [x] Product pages: JSON-LD `Product` structured data (price, currency,
  stock availability) alongside existing Open Graph metadata
- [x] `loading.tsx` skeletons: shop, product detail, admin dashboard,
  admin products, admin orders, admin payments
- [x] `error.tsx` boundaries: storefront, admin dashboard, plus a
  `global-error.tsx` for root-layout failures — all show a friendly
  message and a retry button, never a raw stack trace
- [x] Branded `not-found.tsx` for both the storefront (keeps navbar/footer)
  and the site root
- [x] README: deployment checklist + SEO section, bank-transfer setup step
  updated to point at the now-existing Settings page

## Project status: all 5 phases complete

This is a working, deployable e-commerce application — every flow in the
original spec (guest checkout, card payment via Paystack, bank transfer
with screenshot verification, stock management, admin dashboard) is wired
end-to-end against a real Supabase backend, not mocked data. See the
Deployment Checklist in `README.md` before going live.

## Notes for continuing this build
- All privileged writes (orders, payments, stock changes) must go through
  Server Actions/API routes using `createAdminClient()` from
  `src/lib/supabase/admin.ts` — never the browser client.
- Stock changes during checkout must call the `reserve_stock` Postgres
  function (in `supabase/functions.sql`) so concurrent orders can't oversell.
- Cart is guest-only and lives in `localStorage`; nothing cart-related
  touches Supabase until checkout is submitted.
- Payment confirmation is never based on the client — both the Paystack
  redirect callback and its webhook call `verifyAndRecordPayment`
  (`src/lib/actions/paystack.ts`), which only trusts Paystack's own
  `transaction/verify` response.
- Phase 4's payment-verification screen needs to: list orders where
  `payment_method = 'bank_transfer'` and `payment_status = 'awaiting_verification'`,
  join `payment_proofs` (use `createAdminClient()` to read the private
  bucket — e.g. `supabase.storage.from('payment-proofs').createSignedUrl(...)`
  to show the admin the image), and on confirm/reject set
  `payment_proofs.decision`/`reviewed_by`/`reviewed_at` plus the order's
  `payment_status`/`order_status` accordingly. — **Done in Phase 4**; see
  `src/lib/data/admin-payments.ts` and `src/lib/actions/admin/orders.ts`.
- Admin CRUD/actions intentionally use the RLS-respecting server client
  (`src/lib/supabase/server.ts`), not the service-role client — an
  authenticated admin's session already satisfies the `is_admin()` RLS
  check, so there's no need to bypass RLS for anything under `/admin`.
  The service-role client stays reserved for guest-facing flows that have
  no Supabase Auth session at all (checkout, payment verification,
  screenshot upload).
- Phase 5 should add a signed-out empty state / redirect check to
  `/admin/track-order`-style pages if any are added, and double-check
  every admin mutation still has a loading/error UI (most do via
  `router.refresh()` + local state, but a pass would catch gaps).
