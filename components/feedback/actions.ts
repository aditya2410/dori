'use server'

import { createServiceClient } from '@/lib/supabase/server'

export interface FeedbackInput {
  reason?: string
  message?: string
  landedFrom?: string
  path?: string
}

export async function submitFeedback(input: FeedbackInput): Promise<{ ok: boolean }> {
  const reason = (input.reason ?? '').trim().slice(0, 120) || null
  const message = (input.message ?? '').trim().slice(0, 1000) || null

  // Nothing useful to store — ignore.
  if (!reason && !message) return { ok: false }

  const { error } = await createServiceClient().from('feedback').insert({
    reason,
    message,
    source: 'exit_intent',
    landed_from: (input.landedFrom ?? '').trim().slice(0, 60) || null,
    path: (input.path ?? '').trim().slice(0, 200) || null,
  })

  if (error) {
    console.error('[submitFeedback]', error)
    return { ok: false }
  }
  return { ok: true }
}
