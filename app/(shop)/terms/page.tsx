import type { Metadata } from 'next'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = { title: 'Terms & Conditions — Dori Jaipur' }

export default function TermsPage() {
  return (
    <div className="container py-16 max-w-2xl">
      <div className="space-y-2 mb-10">
        <h1 className="font-serif text-4xl font-normal">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground">Last updated: June 2025</p>
      </div>

      <Separator className="mb-10" />

      <div className="space-y-8 text-sm leading-relaxed">

        <Section title="Acceptance of Terms">
          <p>By accessing or using the Dori Jaipur website and placing an order, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our website.</p>
        </Section>

        <Section title="Products">
          <p>All products sold on Dori Jaipur are handcrafted and may have slight variations in colour, texture, or finish — this is a natural characteristic of handmade goods and is not considered a defect.</p>
          <p>We reserve the right to discontinue any product at any time without notice.</p>
        </Section>

        <Section title="Pricing">
          <p>All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to update prices at any time. The price at the time of your order confirmation is the price you will be charged.</p>
        </Section>

        <Section title="Orders & Payment">
          <ul>
            <li>Orders are confirmed only upon successful payment.</li>
            <li>Payments are processed securely via Razorpay. We do not store your card details.</li>
            <li>We reserve the right to cancel any order at our discretion, in which case a full refund will be issued.</li>
          </ul>
        </Section>

        <Section title="Shipping">
          <p>Please refer to our <a href="/shipping-policy" className="underline underline-offset-4 hover:opacity-70 transition-opacity">Shipping Policy</a> for full details on delivery timelines, charges, and tracking.</p>
        </Section>

        <Section title="Returns & Refunds">
          <p>Please refer to our <a href="/refund-policy" className="underline underline-offset-4 hover:opacity-70 transition-opacity">Refund Policy</a> for full details on returns and refunds.</p>
        </Section>

        <Section title="Intellectual Property">
          <p>All content on this website — including images, text, logos, and designs — is the property of Dori Jaipur and may not be reproduced, distributed, or used without prior written permission.</p>
        </Section>

        <Section title="Limitation of Liability">
          <p>Dori Jaipur shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website. Our total liability shall not exceed the value of the order placed.</p>
        </Section>

        <Section title="Governing Law">
          <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Jaipur, Rajasthan.</p>
        </Section>

        <Section title="Changes to Terms">
          <p>We reserve the right to update these Terms and Conditions at any time. Continued use of the website after any changes constitutes your acceptance of the updated terms.</p>
        </Section>

        <Section title="Contact">
          <p>For any queries regarding these terms, please reach out via our <a href="/contact" className="underline underline-offset-4 hover:opacity-70 transition-opacity">contact page</a>.</p>
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
