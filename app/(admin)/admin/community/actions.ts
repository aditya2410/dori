'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

function revalidate() {
  revalidatePath('/admin/community')
  revalidatePath('/')
}

export async function addCommunityPhoto(url: string): Promise<void> {
  const supabase = createServiceClient()
  const { count } = await supabase
    .from('community_photos')
    .select('id', { count: 'exact', head: true })

  await supabase.from('community_photos').insert({
    url,
    display_order: count ?? 0,
  })
  revalidate()
}

export async function deleteCommunityPhoto(id: string): Promise<void> {
  await createServiceClient().from('community_photos').delete().eq('id', id)
  revalidate()
}

export async function reorderCommunityPhotos(orderedIds: string[]): Promise<void> {
  const supabase = createServiceClient()
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('community_photos').update({ display_order: index }).eq('id', id),
    ),
  )
  revalidate()
}
