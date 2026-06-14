import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { CommunityManager } from './community-manager'

export const metadata: Metadata = { title: 'Dori Family — Admin' }

export default async function CommunityPage() {
  const { data: photos } = await createServiceClient()
    .from('community_photos')
    .select('*')
    .order('display_order', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-normal">Dori Family</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customer photos shown in the scrolling banner on the home page. Drag to reorder.
        </p>
      </div>
      <CommunityManager photos={photos ?? []} />
    </div>
  )
}
