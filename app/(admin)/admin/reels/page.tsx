import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { ReelsManager } from './reels-manager'

export const metadata: Metadata = { title: 'Reels — Admin' }

export default async function ReelsPage() {
  const service = createServiceClient()
  const [{ data: reels }, { data: products }] = await Promise.all([
    service.from('home_reels').select('*').order('display_order', { ascending: true }),
    service
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-normal">Reels</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Videos shown in the &ldquo;Shop our reels&rdquo; row on the home page. Link each to a
          product to make it shoppable. Drag to reorder.
        </p>
      </div>
      <ReelsManager reels={reels ?? []} products={products ?? []} />
    </div>
  )
}
