import { Resend } from 'resend'
import { formatPrice } from './utils'
import type { ShippingAddress } from '@/types/database.types'

const resend = new Resend(process.env.RESEND_API_KEY)

// Set RESEND_FROM_EMAIL once your domain is verified in Resend.
// Use 'onboarding@resend.dev' for local testing only.
const FROM = process.env.RESEND_FROM_EMAIL ?? 'DORI <onboarding@resend.dev>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// ── Shared layout ────────────────────────────────────────────────────────────
function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DORI</title>
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Wordmark -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <a href="${SITE_URL}" style="font-size:22px;letter-spacing:0.15em;color:#1a1a1a;text-decoration:none;font-weight:400;">
                DORI
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;padding:40px 36px;border:1px solid #e8e0d8;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0;text-align:center;font-size:11px;color:#999;letter-spacing:0.05em;">
              DORI · Handcrafted Luxury Goods<br/>
              <a href="${SITE_URL}" style="color:#999;text-decoration:underline;">Visit our store</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function heading(text: string) {
  return `<h1 style="margin:0 0 24px;font-size:22px;font-weight:400;color:#1a1a1a;letter-spacing:0.02em;">${text}</h1>`
}

function bodyText(text: string) {
  return `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#555;">${text}</p>`
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #e8e0d8;margin:24px 0;" />`
}

function itemsTable(items: { name: string; quantity: number; unitPricePaise: number }[]) {
  const rows = items.map(
    (i) => `<tr>
      <td style="padding:8px 0;font-size:13px;color:#1a1a1a;">${i.name} <span style="color:#999;">× ${i.quantity}</span></td>
      <td style="padding:8px 0;font-size:13px;color:#1a1a1a;text-align:right;">${formatPrice(i.unitPricePaise * i.quantity)}</td>
    </tr>`,
  )
  return `<table width="100%" cellpadding="0" cellspacing="0">${rows.join('')}</table>`
}

function totalRow(label: string, value: string, bold = false) {
  const style = bold
    ? 'padding:6px 0;font-size:14px;font-weight:600;color:#1a1a1a;'
    : 'padding:4px 0;font-size:13px;color:#777;'
  return `<tr>
    <td style="${style}">${label}</td>
    <td style="${style}text-align:right;">${value}</td>
  </tr>`
}

function addressBlock(addr: ShippingAddress) {
  const lines = [addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.pincode}`]
    .filter(Boolean)
    .join('<br/>')
  return `<p style="margin:0;font-size:13px;line-height:1.7;color:#555;">
    <strong style="color:#1a1a1a;">${addr.full_name}</strong><br/>
    ${lines}
  </p>`
}

// ── Order confirmation ────────────────────────────────────────────────────────

interface OrderItem {
  name: string
  quantity: number
  unitPricePaise: number
}

interface OrderConfirmationData {
  to: string
  orderNumber: string
  items: OrderItem[]
  subtotalPaise: number
  shippingPaise: number
  discountPaise?: number
  totalPaise: number
  shippingAddress: ShippingAddress
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  const addr = data.shippingAddress
  const firstName = addr.full_name.split(' ')[0]

  const html = layout(`
    ${heading('Order confirmed')}
    ${bodyText(`Hi ${firstName}, thank you for your order. We'll get started on it right away.`)}
    <p style="margin:0 0 24px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#999;">${data.orderNumber}</p>

    ${divider()}

    ${itemsTable(data.items)}

    ${divider()}

    <table width="100%" cellpadding="0" cellspacing="0">
      ${totalRow('Subtotal', formatPrice(data.subtotalPaise))}
      ${data.discountPaise ? totalRow('Discount', `−${formatPrice(data.discountPaise)}`) : ''}
      ${totalRow('Shipping', data.shippingPaise === 0 ? 'Free' : formatPrice(data.shippingPaise))}
      ${totalRow('Total', formatPrice(data.totalPaise), true)}
    </table>

    ${divider()}

    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#999;">Delivering to</p>
    ${addressBlock(addr)}

    ${divider()}

    ${bodyText('Handcrafted orders ship within 3–5 business days. We\'ll send you a tracking number once your order is on its way.')}
  `)

  const text = `Order confirmed — ${data.orderNumber}\n\nHi ${firstName},\n\nThank you for your order.\n\n${data.items.map((i) => `${i.name} × ${i.quantity}  ${formatPrice(i.unitPricePaise * i.quantity)}`).join('\n')}\n\nTotal: ${formatPrice(data.totalPaise)}\n\nDelivering to: ${addr.line1}, ${addr.city} ${addr.pincode}\n\n— DORI`

  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Order confirmed — ${data.orderNumber}`,
    html,
    text,
  })
}

// ── Delivery notification ─────────────────────────────────────────────────────

export async function sendDeliveryEmail(data: { to: string; orderNumber: string }) {
  const html = layout(`
    ${heading('Your order has been delivered')}
    ${bodyText(`Order <strong>${data.orderNumber}</strong> has been delivered. We hope you love it!`)}

    ${divider()}

    ${bodyText('Thank you for choosing DORI. We\'d love to see how you\'re styling your new piece — tag us on Instagram.')}
  `)

  const text = `Your order ${data.orderNumber} has been delivered.\n\nWe hope you love it!\n\nThank you for choosing DORI.\n\n— DORI`

  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Your order has been delivered — ${data.orderNumber}`,
    html,
    text,
  })
}

// ── Shipping notification ─────────────────────────────────────────────────────

export async function sendShippingEmail(data: {
  to: string
  orderNumber: string
  trackingNumber: string
}) {
  const html = layout(`
    ${heading('Your order has shipped')}
    ${bodyText(`Your order <strong>${data.orderNumber}</strong> is on its way via <strong>DTDC</strong>.`)}

    ${divider()}

    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#999;">Tracking number</p>
    <p style="margin:0 0 16px;font-size:22px;font-weight:600;color:#1a1a1a;letter-spacing:0.06em;">${data.trackingNumber}</p>
    ${bodyText('To track your shipment, visit <a href="https://www.dtdc.com/track-your-shipment/" style="color:#1a1a1a;">dtdc.com/track-your-shipment</a> and enter the tracking number above.')}

    ${divider()}

    ${bodyText('Your order will be delivered in 3–5 business days. Thank you for choosing DORI.')}
  `)

  const text = `Your order ${data.orderNumber} has shipped via DTDC.\n\nTracking number: ${data.trackingNumber}\n\nTo track your shipment, visit https://www.dtdc.com/track-your-shipment/ and enter the tracking number above.\n\n— DORI`

  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Your order has shipped — ${data.orderNumber}`,
    html,
    text,
  })
}
