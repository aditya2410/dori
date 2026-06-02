import type { Metadata } from 'next'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = { title: 'Shipping Policy — Dori Jaipur' }

export default function ShippingPolicyPage() {
  return (
    <div className="container py-16 max-w-2xl">
      <div className="space-y-2 mb-10">
        <h1 className="font-serif text-4xl font-normal">Shipping Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: June 2025</p>
      </div>

      <Separator className="mb-10" />

      <div className="space-y-8 text-sm leading-relaxed">

        <Section title="Shipping Fee">
          <p>We charge a flat shipping fee of <strong className="text-foreground">₹150</strong> on all orders, regardless of order value or number of items.</p>
        </Section>

        <Section title="Courier Partner">
          <p>All orders are shipped via <strong className="text-foreground">DTDC</strong>. Once your order is dispatched, you will receive a shipping confirmation email with your tracking number.</p>
          <p>To track your order, visit <a href="https://www.dtdc.com/track-your-shipment/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:opacity-70 transition-opacity">dtdc.com/track-your-shipment</a> and enter your tracking number.</p>
        </Section>

        <Section title="Delivery Time">
          <ul>
            <li>Orders are processed and dispatched within <strong className="text-foreground">1–2 business days</strong> of payment confirmation.</li>
            <li>Delivery typically takes <strong className="text-foreground">3–5 business days</strong> after dispatch, depending on your location.</li>
            <li>Remote areas may take slightly longer.</li>
          </ul>
        </Section>

        <Section title="Shipping Locations">
          <p>We currently ship across India only. International shipping is not available at this time.</p>
        </Section>

        <Section title="Order Tracking">
          <p>A tracking number will be emailed to you once your order has been dispatched. If you have not received a tracking email within 3 business days of your order, please contact us.</p>
        </Section>

        <Section title="Damaged or Lost Shipments">
          <p>In the rare event that your order arrives damaged or is lost in transit, please contact us immediately with your order number and photographs of the damage. We will work with DTDC to resolve the issue promptly.</p>
        </Section>

        <Section title="Contact">
          <p>For any shipping-related queries, reach out via our <a href="/contact" className="underline underline-offset-4 hover:opacity-70 transition-opacity">contact page</a>.</p>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-serif text-xl font-normal">{title}</h2>
      <div className="space-y-2 text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-foreground">
        {children}
      </div>
    </div>
  )
}
