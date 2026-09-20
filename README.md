# Sid Bespoke

A Nigerian e-commerce storefront built with Next.js (App Router), TypeScript,
Tailwind CSS, and Supabase (Postgres, Auth, Storage). Guest checkout, Paystack
card payments, bank-transfer-with-screenshot-upload, and a protected admin
dashboard.

> **Status:** All five build phases are complete — see `PROJECT_STATUS.md`
> for the full breakdown of what was built in each phase.

## 1. Install dependencies

```bash
npm install
```

## 2. Create and connect a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run **`supabase/phase_supabase.sql`** — this one file
   contains everything (schema, RLS policies, functions, storage setup) in
   the correct order, and safely resets/re-runs if you need to run it more
   than once while setting up. Just paste the whole file and click Run.
   (The four files it's built from — `schema.sql`, `rls_policies.sql`,
   `functions.sql`, `storage_setup.sql` — are also included separately if
   you'd rather run them one at a time.)
3. From **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ keep secret, server-only)

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the Supabase values from step 2, plus your Paystack keys and WhatsApp
number (see sections below).

## 4. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`.

## 5. Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the repo in Vercel.
3. Add all variables from `.env.example` under **Project Settings →
   Environment Variables** (do this for Production, Preview, and
   Development environments).
4. Deploy. Vercel will run `next build` automatically.

## 6. Create the first admin user

Admins authenticate via Supabase Auth — there is no public sign-up form.

1. In the Supabase dashboard, go to **Authentication → Users → Add user**
   and create a user with an email + password.
2. In the SQL editor, link that user as an admin:

   ```sql
   insert into admin_profiles (id, full_name, role)
   values ('paste-the-user-uuid-here', 'Your Name', 'superadmin');
   ```

3. Sign in at `/admin/login` with that email/password.

## 7. Configure Paystack (card payments)

1. Create an account at [paystack.com](https://paystack.com).
2. From **Settings → API Keys & Webhooks**, copy your test (or live) secret
   key → `PAYSTACK_SECRET_KEY` (server-only — used to initialize and verify
   transactions, never sent to the browser).
3. In the same settings page, set your **Webhook URL** to:
   ```
   https://your-domain.com/api/webhooks/paystack
   ```
   This is the reliable source of truth for payment confirmation — it
   fires server-to-server even if a customer closes the tab before being
   redirected back. The redirect flow (`/payment/callback`) also verifies
   independently, so either path confirms the order correctly.
4. No products/plans need to be created in Paystack — this integration
   charges one-off amounts per order using the Standard/redirect flow
   (`transaction/initialize` → hosted payment page → `transaction/verify`).

## 8. Configure bank transfer details

Bank details are **not hard-coded** — they're stored in the `store_settings`
table. Once you've created your first admin (step 6), sign in and set them
from **Admin → Settings**. Before that, or to seed them ahead of time, you
can also set them directly in SQL:

```sql
update store_settings set
  bank_name = 'Your Bank',
  account_name = 'Sid Bespoke Ltd',
  account_number = '0123456789',
  whatsapp_number = '2348012345678',
  delivery_fee = 2000,
  delivery_timeframe = 'Orders are usually delivered within 1–3 business days.'
where id = 1;
```

## Deployment checklist

Before going live, walk through this list:

- [ ] All four `supabase/*.sql` files have been run against your **production**
      Supabase project (not just a dev/test one)
- [ ] `.env` variables are set in Vercel for the Production environment —
      double-check `SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY`
      are only ever entered as server-side env vars, never committed to git
- [ ] `NEXT_PUBLIC_SITE_URL` matches your real production domain (it's used
      to build the Paystack callback URL, the sitemap, and Open Graph tags)
- [ ] Paystack is switched from test keys (`sk_test_…`) to live keys
      (`sk_live_…`), and the webhook URL in the Paystack dashboard points at
      your production domain
- [ ] At least one admin user exists and can sign in at `/admin/login`
- [ ] Store settings (Settings page) are filled in: WhatsApp number, bank
      details, delivery fee and timeframe, contact info
- [ ] At least one category and one real product (with images) exist, so
      the homepage and shop aren't empty on first visit
- [ ] Test both payment flows end-to-end with real (or Paystack test) cards
      and a real bank transfer + screenshot upload
- [ ] Visit `/sitemap.xml` and `/robots.txt` on the deployed domain to
      confirm they resolve correctly

## SEO

- `src/app/sitemap.ts` generates `/sitemap.xml` from static routes plus
  every active product and category.
- `src/app/robots.ts` generates `/robots.txt`, disallowing `/admin`, `/api`,
  `/cart`, `/checkout`, and `/payment/callback` (private or dead-end pages
  that shouldn't be indexed).
- Every page sets its own `<title>`/meta description via Next's Metadata
  API; product pages also add Open Graph tags and JSON-LD `Product`
  structured data (price, currency, stock availability) for rich search
  results.

## Project structure

```
sid-bespoke/
├── src/
│   ├── app/
│   │   ├── (storefront)/    # Customer-facing pages — own layout (navbar/footer/cart)
│   │   ├── admin/
│   │   │   ├── login/        # Public admin sign-in (outside the dashboard layout)
│   │   │   └── (dashboard)/  # Protected admin pages — sidebar + auth-checked layout
│   │   ├── api/webhooks/paystack/
│   │   └── layout.tsx        # True root layout: just the HTML shell + fonts
│   ├── lib/
│   │   ├── supabase/         # client.ts (browser), server.ts (SSR/RLS), admin.ts (service role)
│   │   ├── actions/admin/    # Admin server actions (products, orders, categories, settings…)
│   │   └── data/              # Server-side data-access helpers, admin and public
│   ├── components/admin/     # Admin dashboard UI
│   ├── types/database.ts     # DB types (regenerate via Supabase CLI once live)
│   └── middleware.ts          # Session refresh + /admin route protection
├── supabase/
│   ├── schema.sql
│   ├── rls_policies.sql
│   ├── functions.sql
│   └── storage_setup.sql
├── PROJECT_STATUS.md          # Build phase tracker
└── .env.example
```

## Security notes

- `SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY` are **server-only**.
  They are never imported into Client Components and never sent to the
  browser. The `admin.ts` Supabase client is guarded with `server-only` so
  an accidental client-side import fails the build instead of leaking the key.
- All customer-facing writes that must be trusted (orders, payments, stock
  changes) go through Server Actions/API routes using the service-role
  client — RLS blocks these from being written directly by the browser.
- Row Level Security is enabled on every table; see `rls_policies.sql` for
  the full policy set.
- Card payments are never trusted based on the browser redirecting back
  successfully — `/payment/callback` and the `/api/webhooks/paystack`
  webhook both call Paystack's own `transaction/verify` (or check its HMAC
  signature) before an order is ever marked `payment_confirmed`.
- Bank transfer screenshots go to a **private** Storage bucket
  (`payment-proofs`) with no public read or insert policy. Guests can
  upload their own screenshot only through the `uploadPaymentProof` server
  action, which verifies the order's `access_code` first and then uploads
  using the service-role key — never a public bucket policy.
