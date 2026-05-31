'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  createProduct,
  updateProduct,
  type ProductState,
} from '@/app/(admin)/admin/products/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from './image-uploader'
import { toSlug } from '@/lib/utils'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price_paise: number
  stock: number
  is_active: boolean
  images: unknown
}

interface ProductFormProps {
  product?: Product
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : isEdit ? 'Update product' : 'Create product'}
    </Button>
  )
}

export function ProductForm({ product }: ProductFormProps) {
  const isEdit = !!product
  const [imageUrls, setImageUrls] = useState<string[]>(
    Array.isArray(product?.images) ? (product.images as string[]) : [],
  )
  const [nameValue, setNameValue] = useState(product?.name ?? '')
  const [slugValue, setSlugValue] = useState(product?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(isEdit)

  // When editing, bind the product id as the first arg
  type FormAction = (prev: ProductState, formData: FormData) => Promise<ProductState>
  const action: FormAction = isEdit
    ? (updateProduct.bind(null, product.id) as FormAction)
    : createProduct

  const [state, formAction] = useActionState<ProductState, FormData>(action, null)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNameValue(e.target.value)
    if (!slugTouched) setSlugValue(toSlug(e.target.value))
  }

  return (
    <form action={formAction} className="space-y-8 max-w-2xl">
      {/* Images are managed in state and injected via a hidden input */}
      <input type="hidden" name="images" value={JSON.stringify(imageUrls)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Product name</Label>
          <Input
            id="name"
            name="name"
            value={nameValue}
            onChange={handleNameChange}
            placeholder="Hand-stitched Leather Journal"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={slugValue}
            onChange={(e) => {
              setSlugTouched(true)
              setSlugValue(e.target.value)
            }}
            placeholder="hand-stitched-leather-journal"
            required
          />
          <p className="text-xs text-muted-foreground">/products/{slugValue || '…'}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ''}
          placeholder="Describe the material, craft, and care instructions…"
          rows={5}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="1"
            min="1"
            defaultValue={product ? Math.round(product.price_paise / 100) : ''}
            placeholder="2499"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={product?.stock ?? 0}
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          defaultChecked={product?.is_active ?? true}
          className="h-4 w-4 accent-foreground"
        />
        <Label htmlFor="is_active" className="normal-case text-sm font-normal tracking-normal">
          Active — visible in shop
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Images</Label>
        <ImageUploader existingImages={imageUrls} onChange={setImageUrls} />
      </div>

      {state && 'error' in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton isEdit={isEdit} />
        <Button type="button" variant="outline" asChild>
          <a href="/admin/products">Cancel</a>
        </Button>
      </div>
    </form>
  )
}
