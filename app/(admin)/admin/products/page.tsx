import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toggleProductActive } from './actions'

export const metadata = { title: 'Products — Admin' }

export default async function AdminProductsPage() {
  const supabase = createServiceClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, price_paise, stock, is_active, images, created_at')
    .order('created_at', { ascending: false })

  if (error) console.error('[admin/products]', error)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-normal">Products</h1>
        <Button asChild size="sm">
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            New product
          </Link>
        </Button>
      </div>

      {!products?.length ? (
        <p className="text-muted-foreground text-sm">No products yet. Create your first one.</p>
      ) : (
        <div className="border">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/40">
              <tr>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Product
                </th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                  Price
                </th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                  Stock
                </th>
                <th className="text-left p-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {products.map((product, i) => {
                const images = Array.isArray(product.images) ? (product.images as string[]) : []
                return (
                  <tr key={product.id} className={i < products.length - 1 ? 'border-b' : ''}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 shrink-0 bg-secondary overflow-hidden">
                          {images[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={images[0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      {formatPrice(product.price_paise)}
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      {product.stock}
                    </td>
                    <td className="p-4">
                      <Badge variant={product.is_active ? 'success' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Pencil className="size-3.5" />
                            Edit
                          </Link>
                        </Button>
                        <form
                          action={toggleProductActive.bind(null, product.id, !product.is_active)}
                        >
                          <Button type="submit" variant="ghost" size="sm">
                            {product.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
