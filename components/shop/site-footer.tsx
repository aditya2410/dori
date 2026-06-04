'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SocialLinks } from './social-links'

export function SiteFooter() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <footer
      ref={ref}
      className={`border-t border-border/60 mt-16 transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="space-y-4 md:col-span-2">
            <Link
              href="/"
              className="font-serif text-lg tracking-[0.15em] uppercase hover:opacity-70 transition-opacity"
            >
              Dori Jaipur
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Dori Jaipur crafts luxury bags, keychains and embroidered shirts — each piece handmade by skilled artisans in Jaipur using traditional techniques passed down through generations.
            </p>
            <SocialLinks />
          </div>

          {/* Help */}
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-widest">Help</p>
            <nav className="flex flex-col space-y-2.5">
              <FooterLink href="/shipping-policy">Shipping Policy</FooterLink>
              <FooterLink href="/refund-policy">Refund Policy</FooterLink>
              <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms & Conditions</FooterLink>
              <FooterLink href="/contact">Contact Us</FooterLink>
            </nav>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Dori Jaipur. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Handcrafted with love in Jaipur, India.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  )
}
