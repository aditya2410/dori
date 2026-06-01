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
  ctaText: 'EXPLORE COLLECTIONS',
  ctaHref: '/collections',
} as const
