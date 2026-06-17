import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SaleForm } from '@/components/admin/sale-form'

export const metadata = { title: 'New Sale — Admin' }

export default function NewSalePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground" asChild>
          <Link href="/admin/sales">
            <ChevronLeft className="size-4" />
            Sales
          </Link>
        </Button>
        <h1 className="font-serif text-3xl font-normal">New sale</h1>
      </div>

      <SaleForm />
    </div>
  )
}
