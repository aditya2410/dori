import type { Metadata } from 'next'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = { title: 'Privacy Policy — Dori Jaipur' }

export default function PrivacyPolicyPage() {
  return (
    <div className="container py-16 max-w-2xl">
      <div className="space-y-2 mb-10">
        <h1 className="font-serif text-4xl font-normal">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: June 2025</p>
      </div>

      <Separator className="mb-10" />

      <div className="space-y-8 text-sm leading-relaxed">

        <Section title="Information We Collect">
          <p>When you place an order or create an account, we collect:</p>
          <ul>
            <li>Name, email address, and phone number</li>
            <li>Delivery address</li>
            <li>Order history and preferences</li>
          </ul>
          <p>We do not store your payment card details. All payments are processed securely by Razorpay.</p>
        </Section>

        <Section title="How We Use Your Information">
          <p>Your information is used solely to:</p>
          <ul>
            <li>Process and fulfil your orders</li>
            <li>Send order confirmation, shipping, and delivery notifications</li>
            <li>Respond to your queries and provide customer support</li>
          </ul>
          <p>We do not sell, trade, or share your personal data with third parties, except as required to deliver your order (e.g., DTDC for shipping).</p>
        </Section>

        <Section title="Cookies">
          <p>Our website uses essential cookies to keep your cart and session active. We do not use tracking or advertising cookies.</p>
        </Section>

        <Section title="Data Security">
          <p>Your data is stored securely. We use industry-standard encryption for all data transmission. Access to your information is restricted to authorised personnel only.</p>
        </Section>

        <Section title="Your Rights">
          <p>You may request to view, update, or delete your personal data at any time by contacting us at the email below. We will respond within 7 business days.</p>
        </Section>

        <Section title="Contact">
          <p>For any privacy-related queries, please reach out to us via our <a href="/contact" className="underline underline-offset-4 hover:opacity-70 transition-opacity">contact page</a>.</p>
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
