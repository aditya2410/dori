'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  createSeries,
  updateSeries,
  type SeriesState,
} from '@/app/(admin)/admin/series/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUploader } from './image-uploader'
import { toSlug } from '@/lib/utils'

type ImagePosition = 'top' | 'center' | 'bottom' | 'left' | 'right'

const POSITION_OPTIONS: { value: ImagePosition; label: string; hint: string }[] = [
  { value: 'top',    label: 'Top',    hint: 'Keeps the top of the image — best for portraits or products with detail at top' },
  { value: 'center', label: 'Center', hint: 'Default — shows the middle of the image' },
  { value: 'bottom', label: 'Bottom', hint: 'Keeps the bottom — best for flat-lay or ground-level shots' },
  { value: 'left',   label: 'Left',   hint: 'Keeps the left side of the image' },
  { value: 'right',  label: 'Right',  hint: 'Keeps the right side of the image' },
]

interface Series {
  id: string
  name: string
  slug: string
  description: string | null
  cover_image_url: string | null
  image_position: ImagePosition
  display_order: number
  is_active: boolean
}

interface SeriesFormProps {
  series?: Series
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : isEdit ? 'Update series' : 'Create series'}
    </Button>
  )
}

export function SeriesForm({ series }: SeriesFormProps) {
  const isEdit = !!series
  const [coverImages, setCoverImages] = useState<string[]>(
    series?.cover_image_url ? [series.cover_image_url] : [],
  )
  const [nameValue, setNameValue] = useState(series?.name ?? '')
  const [slugValue, setSlugValue] = useState(series?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [position, setPosition] = useState<ImagePosition>(series?.image_position ?? 'center')

  type FormAction = (prev: SeriesState, formData: FormData) => Promise<SeriesState>
  const action: FormAction = isEdit
    ? (updateSeries.bind(null, series.id) as FormAction)
    : createSeries

  const [state, formAction] = useActionState<SeriesState, FormData>(action, null)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNameValue(e.target.value)
    if (!slugTouched) setSlugValue(toSlug(e.target.value))
  }

  return (
    <form action={formAction} className="space-y-8 max-w-2xl">
      {/* Cover image is stored as a single URL; ImageUploader manages the array */}
      <input type="hidden" name="cover_image_url" value={coverImages[0] ?? ''} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Series name</Label>
          <Input
            id="name"
            name="name"
            value={nameValue}
            onChange={handleNameChange}
            placeholder="Mini Bags"
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
            placeholder="mini-bags"
            required
          />
          <p className="text-xs text-muted-foreground">/collections/{slugValue || '…'}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={series?.description ?? ''}
          placeholder="Describe this collection…"
          rows={3}
        />
      </div>

      <div className="space-y-1.5 max-w-[160px]">
        <Label htmlFor="display_order">Display order</Label>
        <Input
          id="display_order"
          name="display_order"
          type="number"
          min="0"
          step="10"
          defaultValue={series?.display_order ?? 100}
          required
        />
        <p className="text-xs text-muted-foreground">Lower = appears first in nav</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          defaultChecked={series?.is_active ?? true}
          className="h-4 w-4 accent-foreground"
        />
        <Label htmlFor="is_active" className="normal-case text-sm font-normal tracking-normal">
          Active — visible in navigation and collections page
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Cover image</Label>
        <ImageUploader existingImages={coverImages} onChange={setCoverImages} />
        <p className="text-xs text-muted-foreground">Used as hero image on the collection page. Only the first image is used.</p>
      </div>

      {/* Image position — controls which part of the image is visible when cropped */}
      <div className="space-y-2">
        <input type="hidden" name="image_position" value={position} />
        <Label>Image focal point</Label>
        <Select value={position} onValueChange={(v) => setPosition(v as ImagePosition)}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POSITION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {POSITION_OPTIONS.find((o) => o.value === position)?.hint}
        </p>
      </div>

      {state && 'error' in state && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton isEdit={isEdit} />
        <Button type="button" variant="outline" asChild>
          <a href="/admin/series">Cancel</a>
        </Button>
      </div>
    </form>
  )
}
