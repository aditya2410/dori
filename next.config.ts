import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // razorpay uses Node.js internals (crypto, http) that webpack can't bundle
  serverExternalPackages: ['razorpay'],
  images: {
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
