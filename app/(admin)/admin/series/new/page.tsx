import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { SeriesForm } from '@/components/admin/series-form'

export const metadata: Metadata = { title: 'New Collection — Admin' }

export default function NewSeriesPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground" asChild>
          <Link href="/admin/series">
            <ChevronLeft className="size-4" />
            Collections
          </Link>
        </Button>
        <h1 className="font-serif text-3xl font-normal">New collection</h1>
      </div>
      <SeriesForm />
    </div>
  )
}
