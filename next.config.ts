import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // razorpay uses Node.js internals (crypto, http) that webpack can't bundle
  serverExternalPackages: ['razorpay'],
  images: {
    // Serve a single modern format. AVIF doubles the number of transformations
    // (one write per format) for marginal size gains, so WebP only.
    formats: ['image/webp'],
    // Cache optimized images for 31 days so unchanged images aren't
    // re-transformed and re-written on every request.
    minimumCacheTTL: 2678400,
    // Allowlist only the quality values we actually render (default 75 + the
    // quality={90} used on hero/gallery) so stray values can't spawn extra writes.
    qualities: [75, 90],
    // Trimmed to the widths we actually serve. We have full-bleed hero images
    // (100vw) but never render above ~1920px, so the 2048/3840 4K variants are dropped.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Fixed-size thumbnails top out at 80px (cart/checkout), so cover 1x/2x of those.
    imageSizes: [64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Used by seed data for placeholder product images
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
}

export default nextConfig
