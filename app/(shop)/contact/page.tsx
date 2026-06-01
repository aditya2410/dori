import type { Metadata } from 'next'
import Link from 'next/link'
import { ContactForm } from '@/components/shop/contact-form'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with us. We reply within 24 hours.',
}

export default function ContactPage() {
  const whatsappHref = siteConfig.whatsappNumber
    ? `https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, '')}`
    : null

  return (
    <div className="container py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">

        {/* Left: heading + form */}
        <div>
          <p className="font-sans text-xs tracking-[0.3em] text-muted-foreground uppercase mb-3">
            Get in touch
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-light mb-6">
            We'd love to hear from you.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-10">
            Whether you have a question about a piece, want to place a custom order, or just
            want to say hello — we reply to every message, usually within 24 hours.
          </p>
          <ContactForm />
        </div>

        {/* Right: contact details */}
        <div className="space-y-8 md:pt-16">
          <div>
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">
              Email
            </p>
            <Link
              href={`mailto:${siteConfig.contactEmail}`}
              className="text-sm hover:text-muted-foreground transition-colors"
            >
              {siteConfig.contactEmail}
            </Link>
          </div>

          {whatsappHref && (
            <div>
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">
                WhatsApp
              </p>
              <Link
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:text-muted-foreground transition-colors"
              >
                {siteConfig.whatsappNumber}
              </Link>
            </div>
          )}

          <div>
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">
              Location
            </p>
            <p className="text-sm text-muted-foreground">Jaipur, India</p>
          </div>

          <div>
            <p className="font-sans text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">
              Hours
            </p>
            <p className="text-sm text-muted-foreground">Mon–Sat · 10am–7pm IST</p>
          </div>
        </div>

      </div>
    </div>
  )
}
