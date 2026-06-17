import type { createServiceClient } from '@/lib/supabase/server'

type Service = ReturnType<typeof createServiceClient>

/**
 * Resolve a user id for an email, creating a passwordless account if none
 * exists. Used by guest checkout so the order is linked to an account the
 * customer can later access via an email login code.
 *
 * Existing accounts (including password/Google ones) are reused — the order
 * just attaches to them. profiles.email mirrors auth.users.email for lookup.
 */
export async function getOrCreateUserByEmail(
  service: Service,
  email: string,
  fullName?: string,
): Promise<{ userId: string } | { error: string }> {
  const normalized = email.trim().toLowerCase()

  const existing = await service
    .from('profiles')
    .select('id')
    .ilike('email', normalized)
    .maybeSingle()
  if (existing.data) return { userId: existing.data.id }

  const { data, error } = await service.auth.admin.createUser({
    email: normalized,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  })

  if (data?.user) return { userId: data.user.id }

  // Race: another request created the account between the lookup and now.
  const retry = await service
    .from('profiles')
    .select('id')
    .ilike('email', normalized)
    .maybeSingle()
  if (retry.data) return { userId: retry.data.id }

  console.error('[getOrCreateUserByEmail]', error?.message)
  return { error: 'Could not set up your account. Please try again.' }
}
