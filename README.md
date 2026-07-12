# DORI

A minimal, luxury D2C e-commerce storefront built with Next.js 15, Supabase, and Razorpay.

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Database + Auth | Supabase (Postgres + Auth + Storage) |
| Payments | Razorpay (INR, Indian market) |
| Email | Resend |
| Styles | Tailwind CSS v3 + shadcn/ui |
| Deploy | Vercel |

---

## Local Development

### Prerequisites

- Node.js ≥ 20
- A [Supabase](https://supabase.com) project
- A [Razorpay](https://razorpay.com) account (test mode is fine initially)
- A [Resend](https://resend.com) account

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in every value in `.env.local`. See inline comments for where to find each key.

### 3. Run database migrations

Paste each file in order into the **Supabase SQL Editor** and run:

1. `supabase/migrations/0001_init.sql` — tables, RLS, grants, triggers
2. `supabase/migrations/0002_cart.sql` — cart_items table
3. `supabase/migrations/0003_helpers.sql` — increment_stock function

### 4. Create Storage bucket

Supabase → Storage → **New bucket** → name: `product-images` → toggle **Public** → Create

### 5. Seed sample products (optional)

```bash
npm run seed
```

Or paste the seed SQL from `scripts/seed.ts` into the SQL Editor.

### 6. Set your account as admin

```sql
update public.profiles
set role = 'admin'
where id = '<your-user-id>';
```

Find your user ID: Supabase → Authentication → Users.

### 7. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourname/dori.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Next.js — no build config needed

### 3. Add environment variables

In Vercel → Project → **Settings → Environment Variables**, add every variable from `.env.example`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (secret) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay → Settings → API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay → Settings → Webhooks (after creating) |
| `RESEND_API_KEY` | Resend → API Keys |
| `RESEND_FROM_EMAIL` | `DORI <orders@yourdomain.com>` (after domain verified) |
| `NEXT_PUBLIC_SITE_URL` | Your production URL, e.g. `https://dori.vercel.app` |

### 4. Deploy

Click **Deploy**. Vercel builds and gives you a URL like `dori.vercel.app`.

### 5. Update Supabase redirect URLs

Supabase → Authentication → **URL Configuration**:
- **Site URL**: `https://dori.vercel.app`
- **Redirect URLs**: add `https://dori.vercel.app/callback`

### 6. Set up Razorpay webhook

Razorpay → Settings → **Webhooks → Add New Webhook**:
- **Webhook URL**: `https://dori.vercel.app/api/webhooks/razorpay`
- **Secret**: any random string → save as `RAZORPAY_WEBHOOK_SECRET` in Vercel
- **Events**: check `payment.captured` and `payment.failed`

### 7. Switch Razorpay to Live mode

When ready for real payments:
1. Razorpay dashboard → switch to **Live** mode
2. Generate live API keys
3. Update `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel with the live keys
4. Redeploy

---

## Custom Domain (optional)

### Connect to Vercel

Vercel → Project → Settings → **Domains** → add `yourdomain.com` → follow DNS instructions.

### Verify on Resend for emails

1. Resend → **Domains → Add Domain** → enter `yourdomain.com`
2. Add the SPF, DKIM, and DMARC records at your registrar
3. Click Verify (takes up to 24 hours)
4. Update Vercel env: `RESEND_FROM_EMAIL=DORI <orders@yourdomain.com>`
5. Update `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`

---

## Project Structure

```
app/
  (shop)/          Public storefront — home, products, cart, checkout
  (auth)/          Login, signup, OAuth callback
  (account)/       Customer account area (profile, addresses, orders)
  (admin)/         Admin dashboard (products, orders)
  (checkout)/      Checkout + order confirmation (no shop header)
  api/             orders/create · orders/verify · webhooks/razorpay · upload
lib/
  supabase/        server.ts · browser.ts · middleware.ts
  razorpay.ts      Client + HMAC verification
  email.ts         Resend transactional email (order confirmed, shipped)
  utils.ts         cn() · formatPrice() · toSlug() · generateOrderNumber()
types/
  database.types.ts  Full Supabase schema types
  razorpay.d.ts      window.Razorpay type declarations
supabase/
  migrations/      0001_init · 0002_cart · 0003_helpers
components/
  ui/              shadcn primitives
  shop/            SiteHeader · ProductCard · AddToCart · CartIcon
  checkout/        CheckoutFlow
  account/         AddressForm · ProfileForm
  admin/           ProductForm · ImageUploader · OrderActions · QuickOrderAction
```

---

## Security Notes

- **Order amounts** are always computed server-side from DB prices — the client never sends a price
- **Razorpay signatures** verified with `crypto.timingSafeEqual` (timing-attack safe)
- **Webhook idempotency** enforced by a unique DB index on `razorpay_payment_id`
- **Stock decrement** is atomic via a Postgres function — concurrent orders can't oversell
- **Admin routes** are role-checked server-side in the layout; middleware only handles session existence
- **Service role key** is never exposed to the browser — all mutations go through API routes

---

## Regenerating Supabase Types

After any schema change:

```bash
npx supabase gen types typescript --project-id <your-project-id> > types/database.types.ts
```

---

## Media Pipeline (images & videos)

Product media lives in Supabase Storage (`product-images`, `product-videos`).
Uploads are cached for a year on upload (`cache-control: max-age=31536000`) so the
CDN/browser stop re-fetching on every view — this is what keeps Supabase egress
down under ad traffic. Images are also compressed to WebP client-side before upload.

**Videos are not transcoded automatically.** Vercel Hobby can't run ffmpeg
server-side, and video bytes upload client→Supabase directly (bypassing the app),
so raw phone exports (often HEVC/4K, tens of MB) would otherwise go up as-is —
oversized and, for HEVC, unplayable in Chrome/Firefox. After uploading or replacing
a product/reel/series video in admin, run the normalizer:

```bash
# requires ffmpeg on PATH (brew install ffmpeg)
npx tsx scripts/compress-videos.ts            # dry run — shows what it would do
npx tsx scripts/compress-videos.ts --apply    # re-encode + re-upload in place
```

It's idempotent: it downscales to ≤1280px, transcodes to H.264 MP4 (CRF 24, no
audio), and re-uploads in place — skipping any video already optimized, so it's
safe to run anytime. URLs are unchanged, so no rows need editing.

### Maintenance scripts

| Script | Purpose |
|---|---|
| `scripts/compress-videos.ts` | Normalize product videos to web-optimized H.264 (run after uploads). |
| `scripts/compress-product-images.ts` | Re-encode `product-images` to WebP (≤1600px) in place. |
| `scripts/fix-storage-cache.ts` | Repair `cache-control` on existing objects; `--delete-orphans` (off by default) prunes unreferenced files. |
| `scripts/reprocess-images.ts` | Downscale oversized image originals in place (backs up to `originals/`). |

> **Note on egress:** product/gallery/card images render through Next/Image, so
> they're served by Vercel's optimizer (fetched from Supabase ~once per 31 days),
> not per view. The dominant Supabase egress is **video** (direct `<video>`) plus
> a few plain-`<img>` home surfaces — keep videos small and cached.

All three read `.env.local` and log applied changes to the `ops_log` table. On
Node < 20 they need `NODE_EXTRA_CA_CERTS` pointing at an exported system-CA PEM.
