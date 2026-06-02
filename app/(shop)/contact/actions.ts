'use server'

import { z } from 'zod'
import { Resend } from 'resend'
import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'

const ContactSchema = z.object({
  name:    z.string().min(2,  'Name must be at least 2 characters').max(100),
  email:   z.string().email('Please enter a valid email').max(200),
  phone:   z.string().min(7,  'Please enter a valid phone number').max(20),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

export type ContactFormState = {
  ok?: boolean
  errors?: {
    name?: string
    email?: string
    phone?: string
    message?: string
    _form?: string
  }
}

export async function submitContact(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = {
    name:    String(formData.get('name')    ?? ''),
    email:   String(formData.get('email')   ?? ''),
    phone:   String(formData.get('phone')   ?? ''),
    message: String(formData.get('message') ?? ''),
  }

  const parsed = ContactSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    return {
      errors: {
        name:    fieldErrors.name?.[0],
        email:   fieldErrors.email?.[0],
        phone:   fieldErrors.phone?.[0],
        message: fieldErrors.message?.[0],
      },
    }
  }

  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()

  const supabase = createServiceClient()

  // Rate limit: 3 submissions per IP per hour
  // Set CONTACT_RATE_LIMIT_DISABLED=true in .env.local to bypass during testing
  if (ip && process.env.CONTACT_RATE_LIMIT_DISABLED !== 'true') {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gt('created_at', oneHourAgo)

    if ((count ?? 0) >= 3) {
      return { errors: { _form: 'Too many messages. Please try again later.' } }
    }
  }

  const { error: insertError } = await supabase.from('contact_messages').insert({
    ...parsed.data,
    ip_address: ip ?? null,
  })

  if (insertError) {
    console.error('[contact] insert error:', insertError)
    return { errors: { _form: 'Something went wrong. Please try again.' } }
  }

  // Notification email
  const fromEmail  = process.env.RESEND_FROM_EMAIL
  const toEmail    = process.env.CONTACT_NOTIFICATION_EMAIL   // private delivery address, never shown on site
  const resendKey  = process.env.RESEND_API_KEY

  console.log('[contact] email config →', { from: fromEmail, to: toEmail, hasKey: !!resendKey })

  if (!resendKey || !fromEmail || !toEmail) {
    console.error('[contact] RESEND_API_KEY, RESEND_FROM_EMAIL, or CONTACT_NOTIFICATION_EMAIL is not set — skipping email')
    return { ok: true }
  }

  try {
    const resend = new Resend(resendKey)
    const result = await resend.emails.send({
      from:    fromEmail,
      to:      toEmail,
      replyTo: parsed.data.email,
      subject: `New contact message from ${parsed.data.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(parsed.data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(parsed.data.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(parsed.data.phone)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(parsed.data.message).replace(/\n/g, '<br>')}</p>
      `,
    })
    console.log('[contact] email result →', result)
  } catch (e) {
    console.error('[contact] email error:', e)
  }

  return { ok: true }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c),
  )
}
