import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { SeriesForm } from '@/components/admin/series-form'

export const metadata: Metadata = { title: 'Edit Series — Admin' }

export default async function EditSeriesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: series } = await createServiceClient()
    .from('series')
    .select('id, name, slug, description, cover_image_url, image_position, display_order, is_active')
    .eq('id', id)
    .single()

  if (!series) notFound()

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground" asChild>
          <Link href="/admin/series">
            <ChevronLeft className="size-4" />
            Series
          </Link>
        </Button>
        <h1 className="font-serif text-3xl font-normal">Edit series</h1>
      </div>
      <SeriesForm series={series} />
    </div>
  )
}
