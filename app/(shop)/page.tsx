import type { Metadata } from 'next'
import { Hero } from '@/components/home/hero'
import { BestSellers } from '@/components/home/best-sellers'

export const metadata: Metadata = {
  title: 'Dori Jaipur — Handcrafted Luxury Goods',
  description: 'Handcrafted in Jaipur. Made slowly, by real people, who are paid well.',
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <BestSellers />
    </>
  )
}
