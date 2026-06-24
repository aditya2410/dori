import type { Metadata } from 'next'
import { Hero3D } from '@/components/three/hero-3d'
import { BestSellers } from '@/components/home/best-sellers'
import { CommunityBanner } from '@/components/home/community-banner'
import { createServiceClient } from '@/lib/supabase/server'

// Refresh periodically so scheduled sales appear/expire near their start/end
// time even without an admin action (which revalidates '/' immediately).
export const revalidate = 600

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  title: 'Dori Jaipur — Handcrafted Luxury Bags & Accessories',
  description: 'Dori Jaipur — handcrafted luxury bags and accessories made in Jaipur. Shop pearl bags, beaded clutches, crystal handbags and handmade keychains. Ships across India.',
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
      <BestSellers />
      <CommunityBanner photos={communityPhotos ?? []} />
    </>
  )
}
