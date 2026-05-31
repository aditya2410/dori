import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductForm } from '@/components/admin/product-form'

export const metadata = { title: 'New Product — Admin' }

export default function NewProductPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground" asChild>
          <Link href="/admin/products">
            <ChevronLeft className="size-4" />
            Products
          </Link>
        </Button>
        <h1 className="font-serif text-3xl font-normal">New product</h1>
      </div>

      <ProductForm />
    </div>
  )
}
