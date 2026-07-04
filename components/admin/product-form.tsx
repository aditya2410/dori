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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MediaUploader, type MediaItem } from './media-uploader'
import { RichTextEditor } from './rich-text-editor'
import { toSlug } from '@/lib/utils'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price_paise: number
  discount_percent: number | null
  stock: number
  is_active: boolean
  is_bestseller: boolean
  bestseller_order: number | null
  images: unknown
  video_url: string | null
  video_position: number | null
}

interface SeriesOption {
  id: string
  name: string
}

interface ProductFormProps {
  product?: Product
  activeSeries?: SeriesOption[]
  currentSeriesId?: string | null
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : isEdit ? 'Update product' : 'Create product'}
    </Button>
  )
}

export function ProductForm({ product, activeSeries = [], currentSeriesId = null }: ProductFormProps) {
  const isEdit = !!product

  // Reconstruct the combined media order from images + video_url + video_position.
  const initialMedia: MediaItem[] = (() => {
    const imgs = Array.isArray(product?.images) ? (product.images as string[]) : []
    const list: MediaItem[] = imgs.map((url) => ({ type: 'image', url }))
    if (product?.video_url) {
      const pos = product.video_position ?? list.length
      list.splice(Math.min(Math.max(pos, 0), list.length), 0, { type: 'video', url: product.video_url })
    }
    return list
  })()
  const [media, setMedia] = useState<MediaItem[]>(initialMedia)

  // Derived values for submission
  const imageUrls = media.filter((m) => m.type === 'image').map((m) => m.url)
  const videoIndex = media.findIndex((m) => m.type === 'video')
  const videoUrl = videoIndex >= 0 ? media[videoIndex].url : ''

  const [description, setDescription] = useState(product?.description ?? '')
  const [nameValue, setNameValue] = useState(product?.name ?? '')
  const [slugValue, setSlugValue] = useState(product?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(false)
  const NONE = '__none__'
  const [seriesId, setSeriesId] = useState<string>(currentSeriesId ?? NONE)
  const [isBestseller, setIsBestseller] = useState(product?.is_bestseller ?? false)

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
      <input type="hidden" name="images" value={JSON.stringify(imageUrls)} />
      <input type="hidden" name="video_url" value={videoUrl} />
      <input type="hidden" name="video_position" value={videoIndex >= 0 ? String(videoIndex) : ''} />
      <input type="hidden" name="description" value={description} />
      {/* Convert sentinel back to empty string so the action receives '' for "no series" */}
      <input type="hidden" name="series_id" value={seriesId === NONE ? '' : seriesId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Product name</Label>
          <Input
            id="name"
            name="name"
            value={nameValue}
            onChange={handleNameChange}
            placeholder="White Pearl Bag"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            value={slugValue}
            onChange={(e) => { setSlugTouched(true); setSlugValue(e.target.value) }}
            placeholder="white-pearl-bag"
            required
          />
          <p className="text-xs text-muted-foreground">/products/{slugValue || '…'}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="Describe the material, craft, and care instructions…"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
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
          <Label htmlFor="discount_percent">Discount %</Label>
          <Input
            id="discount_percent"
            name="discount_percent"
            type="number"
            step="1"
            min="0"
            max="99"
            defaultValue={product?.discount_percent ?? ''}
            placeholder="e.g. 26"
          />
          <p className="text-xs text-muted-foreground">Shows a strikethrough original &amp; “% OFF” badge</p>
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

      {/* Series */}
      {activeSeries.length > 0 && (
        <div className="space-y-1.5">
          <Label>Series</Label>
          <Select value={seriesId} onValueChange={setSeriesId}>
            <SelectTrigger>
              <SelectValue placeholder="None — not part of a series" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {activeSeries.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Bestseller */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input
            id="is_bestseller"
            name="is_bestseller"
            type="checkbox"
            checked={isBestseller}
            onChange={(e) => setIsBestseller(e.target.checked)}
            className="h-4 w-4 accent-foreground"
          />
          <Label htmlFor="is_bestseller" className="normal-case text-sm font-normal tracking-normal">
            Best seller — shown on home page
          </Label>
        </div>

        {isBestseller && (
          <div className="space-y-1.5 max-w-[160px] pl-7">
            <Label htmlFor="bestseller_order">Display order</Label>
            <Input
              id="bestseller_order"
              name="bestseller_order"
              type="number"
              min="1"
              step="1"
              defaultValue={product?.bestseller_order ?? ''}
              placeholder="1"
            />
            <p className="text-xs text-muted-foreground">Lower = shown first</p>
          </div>
        )}
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
        <Label>Media</Label>
        <p className="text-xs text-muted-foreground">Photos and an optional video. Drag to set the order shown on the product page.</p>
        <MediaUploader existing={media} onChange={setMedia} />
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
