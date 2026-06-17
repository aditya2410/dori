import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SaleForm } from '@/components/admin/sale-form'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Edit Sale — Admin' }

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: sale } = await createServiceClient()
    .from('sales')
    .select('*')
    .eq('id', id)
    .single()

  if (!sale) notFound()

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground" asChild>
          <Link href="/admin/sales">
            <ChevronLeft className="size-4" />
            Sales
          </Link>
        </Button>
        <h1 className="font-serif text-3xl font-normal">Edit sale</h1>
      </div>

      <SaleForm sale={sale} />
    </div>
  )
}
