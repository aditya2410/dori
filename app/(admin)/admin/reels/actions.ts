'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

function revalidate() {
  revalidatePath('/admin/reels')
  revalidatePath('/')
}

export async function addHomeReel(
  videoUrl: string,
  productId?: string | null,
): Promise<void> {
  const supabase = createServiceClient()
  const { count } = await supabase
    .from('home_reels')
    .select('id', { count: 'exact', head: true })

  await supabase.from('home_reels').insert({
    video_url: videoUrl,
    product_id: productId || null,
    display_order: count ?? 0,
  })
  revalidate()
}

export async function deleteHomeReel(id: string): Promise<void> {
  await createServiceClient().from('home_reels').delete().eq('id', id)
  revalidate()
}

export async function reorderHomeReels(orderedIds: string[]): Promise<void> {
  const supabase = createServiceClient()
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('home_reels').update({ display_order: index }).eq('id', id),
    ),
  )
  revalidate()
}

export async function setReelActive(id: string, isActive: boolean): Promise<void> {
  await createServiceClient().from('home_reels').update({ is_active: isActive }).eq('id', id)
  revalidate()
}

export async function setReelProduct(id: string, productId: string | null): Promise<void> {
  await createServiceClient()
    .from('home_reels')
    .update({ product_id: productId || null })
    .eq('id', id)
  revalidate()
}
