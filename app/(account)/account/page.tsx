import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/account/profile-form'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = { title: 'Profile' }

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await createServiceClient()
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-normal">Profile</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <Separator />
      <ProfileForm fullName={profile?.full_name ?? null} phone={profile?.phone ?? null} />
    </div>
  )
}
