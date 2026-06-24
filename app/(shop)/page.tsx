import type { Metadata } from 'next'
import { Hero3D } from '@/components/three/hero-3d'
import { BestSellers } from '@/components/home/best-sellers'
import { CommunityBanner } from '@/components/home/community-banner'
import { CraftSection } from '@/components/home/craft-section'
import { MarqueeWords } from '@/components/home/marquee-words'
import { Reveal } from '@/components/reveal'
import { createServiceClient } from '@/lib/supabase/server'

export const revalidate = 600

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  title: 'Dori Jaipur — Handcrafted Luxury Bags & Accessories',
  description:
    'Dori Jaipur — handcrafted luxury bags and accessories made in Jaipur. Shop pearl bags, beaded clutches, crystal handbags and handmade keychains. Ships across India.',
}

export default async function HomePage() {
  const { data: communityPhotos } = await createServiceClient()
    .from('community_photos')
    .select('id, url')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  return (
    <>
      <Hero3D />

      <MarqueeWords />

      <CraftSection />

      <Reveal effect="up">
        <BestSellers />
      </Reveal>

      <Reveal effect="fade">
        <CommunityBanner photos={communityPhotos ?? []} />
      </Reveal>
    </>
  )
}
