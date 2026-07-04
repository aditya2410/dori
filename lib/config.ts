export const siteConfig = {
  brandName: 'Dori Jaipur',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@dorijaipur.in',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
} as const

export type SocialLink = {
  name: string
  url: string
  icon: 'instagram' | 'facebook' | 'pinterest' | 'youtube'
}

export function getSocialLinks(): SocialLink[] {
  return (
    [
      { name: 'Instagram', url: process.env.NEXT_PUBLIC_INSTAGRAM_URL, icon: 'instagram' as const },
      { name: 'Facebook',  url: process.env.NEXT_PUBLIC_FACEBOOK_URL,  icon: 'facebook'  as const },
      { name: 'Pinterest', url: process.env.NEXT_PUBLIC_PINTEREST_URL, icon: 'pinterest' as const },
      { name: 'YouTube',   url: process.env.NEXT_PUBLIC_YOUTUBE_URL,   icon: 'youtube'   as const },
    ] as Array<{ name: string; url: string | undefined; icon: SocialLink['icon'] }>
  ).filter((s): s is SocialLink => Boolean(s.url && s.url.length > 0))
}

export const heroConfig = {
  image: '/images/hero.webp',
  headline: 'One pearl at a time.',
  subheadline: 'From our hands, with love in every seam.',
  // Conversion hypothesis: reel visitors arrive with intent for a specific
  // look — send them to the curated, proof-backed shelf in one tap instead
  // of a collections decision. Revert: 'EXPLORE COLLECTIONS' / '/collections'.
  ctaText: 'SHOP BESTSELLERS',
  ctaHref: '/#bestsellers',
} as const

export const instagramConfig = {
  handle: '@dori.jaipur',
  url: process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/dori.jaipur',
} as const

// First-order discount handed out by the exit-intent capture. `code` must exist
// as an active coupon in the sales admin for it to actually apply at checkout.
export const welcomeOffer = {
  code: process.env.NEXT_PUBLIC_WELCOME_CODE || 'FIRST10',
  percent: Number(process.env.NEXT_PUBLIC_WELCOME_PERCENT || '10'),
} as const

// ⚠️ PLACEHOLDERS — replace with real DM messages (with the customer's
// permission) before merging. Keep them short, lowercase, unpolished:
// that texture is what makes them read as real.
export const dmQuotes = [
  {
    text: "bag came todayyy — it's even prettier than the reel, the crystals actually sparkle. got so many compliments at the wedding",
    name: 'ananya.s',
  },
  {
    text: "ordered a second one for my sister because she wouldn't stop borrowing mine",
    name: 'meher.k',
  },
] as const
