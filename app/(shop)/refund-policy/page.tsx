import type { Metadata } from 'next'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = { alternates: { canonical: '/refund-policy' }, title: 'Refund Policy — Dori Jaipur' }

export default function RefundPolicyPage() {
  return (
    <div className="container py-16 max-w-2xl">
      <div className="space-y-2 mb-10">
        <h1 className="font-serif text-4xl font-normal">Refund Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: June 2025</p>
      </div>

      <Separator className="mb-10" />

      <div className="space-y-8 text-sm leading-relaxed">

        <Section title="Our Commitment">
          <p>Each Dori Jaipur piece is handcrafted with great care. If you are not completely satisfied with your purchase, we are here to help.</p>
        </Section>

        <Section title="Returns">
          <ul>
            <li>You may request a return within <strong className="text-foreground">7 days</strong> of delivery.</li>
            <li>Items must be unused, in their original condition, and with all original packaging.</li>
            <li>Customised or made-to-order items are not eligible for return.</li>
          </ul>
        </Section>

        <Section title="How to Initiate a Refund">
          <p>To request a refund, please contact us via our <a href="/contact" className="underline underline-offset-4 hover:opacity-70 transition-opacity">contact page</a> with:</p>
          <ul>
            <li>Your order number</li>
            <li>Reason for the return</li>
            <li>Photographs of the item (if damaged or defective)</li>
          </ul>
          <p>Our team will review your request and respond within <strong className="text-foreground">2 business days</strong>.</p>
        </Section>

        <Section title="Refund Process">
          <p>Once your return is approved and the item is received and inspected:</p>
          <ul>
            <li>Refunds are processed to your original payment method.</li>
            <li>Please allow <strong className="text-foreground">5–7 business days</strong> for the refund to reflect in your account, depending on your bank.</li>
          </ul>
        </Section>

        <Section title="Damaged or Defective Items">
          <p>If you receive a damaged or defective item, please contact us within 48 hours of delivery with photographs. We will arrange a replacement or full refund at no additional cost to you.</p>
        </Section>

        <Section title="Shipping Costs">
          <p>Return shipping costs are to be borne by the customer unless the item is damaged or defective, in which case we will arrange a pickup.</p>
        </Section>

        <Section title="Contact">
          <p>For any refund-related queries, please reach out via our <a href="/contact" className="underline underline-offset-4 hover:opacity-70 transition-opacity">contact page</a>.</p>
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
