import type { Metadata } from 'next'
import { Hero } from '@/components/home/hero'
import { BestSellers } from '@/components/home/best-sellers'

export const metadata: Metadata = {
  title: 'Dori Jaipur — Handcrafted Luxury Bags & Accessories',
  description: 'Dori Jaipur — handcrafted luxury bags and accessories made in Jaipur. Shop pearl bags, beaded clutches, crystal handbags and handmade keychains. Ships across India.',
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <BestSellers />
    </>
  )
}
