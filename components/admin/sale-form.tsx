'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createSale, updateSale, type SaleState } from '@/app/(admin)/admin/sales/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Sale {
  id: string
  code: string
  description: string | null
  banner_color: string | null
  discount_percent: number
  min_order_paise: number | null
  max_discount_paise: number | null
  usage_limit: number | null
  starts_at: string
  ends_at: string
  is_active: boolean
}

interface SaleFormProps {
  sale?: Sale
}

// Convert a stored ISO timestamp to a value the datetime-local input understands
// (YYYY-MM-DDTHH:mm in the admin's local timezone).
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// datetime-local string (local tz) → ISO (UTC). Done in the browser so the
// admin's timezone is used, not the server's.
function toISO(local: string): string {
  if (!local) return ''
  const d = new Date(local)
  return isNaN(d.getTime()) ? '' : d.toISOString()
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : isEdit ? 'Update sale' : 'Create sale'}
    </Button>
  )
}

export function SaleForm({ sale }: SaleFormProps) {
  const isEdit = !!sale

  const [startsLocal, setStartsLocal] = useState(toLocalInput(sale?.starts_at ?? null))
  const [endsLocal, setEndsLocal] = useState(toLocalInput(sale?.ends_at ?? null))

  type FormAction = (prev: SaleState, formData: FormData) => Promise<SaleState>
  const action: FormAction = isEdit
    ? (updateSale.bind(null, sale.id) as FormAction)
    : createSale

  const [state, formAction] = useActionState<SaleState, FormData>(action, null)

  const rupees = (paise: number | null) => (paise != null ? String(Math.round(paise / 100)) : '')

  return (
    <form action={formAction} className="space-y-8 max-w-2xl">
      {/* Dates are converted to ISO (UTC) here so the admin's timezone is used. */}
      <input type="hidden" name="starts_at" value={toISO(startsLocal)} />
      <input type="hidden" name="ends_at" value={toISO(endsLocal)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            name="code"
            defaultValue={sale?.code ?? ''}
            placeholder="FIRST10"
            className="uppercase tracking-wider"
            onChange={(e) => { e.target.value = e.target.value.toUpperCase() }}
            required
          />
          <p className="text-xs text-muted-foreground">Customers type this at checkout. Letters and numbers only.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="discount_percent">Discount %</Label>
          <Input
            id="discount_percent"
            name="discount_percent"
            type="number"
            min="1"
            max="100"
            step="1"
            defaultValue={sale?.discount_percent ?? ''}
            placeholder="10"
            required
          />
          <p className="text-xs text-muted-foreground">Percentage off the subtotal.</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Banner text (optional)</Label>
        <Input
          id="description"
          name="description"
          defaultValue={sale?.description ?? ''}
          placeholder="Launch offer — 10% off your first order"
        />
        <p className="text-xs text-muted-foreground">
          Shown in the scrolling banner on the home page. Leave blank to auto-generate from the code and discount.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="banner_color">Banner color</Label>
        <div className="flex items-center gap-3">
          <input
            id="banner_color"
            name="banner_color"
            type="color"
            defaultValue={sale?.banner_color ?? '#1a1a1a'}
            className="h-9 w-14 cursor-pointer rounded border bg-background p-1"
          />
          <span className="text-xs text-muted-foreground">Background of the home page banner. Text color adjusts automatically.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label htmlFor="starts_at">Starts</Label>
          <Input
            id="starts_at"
            type="datetime-local"
            value={startsLocal}
            onChange={(e) => setStartsLocal(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ends_at">Ends</Label>
          <Input
            id="ends_at"
            type="datetime-local"
            value={endsLocal}
            onChange={(e) => setEndsLocal(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Optional limits</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="min_order">Min. order (₹)</Label>
            <Input
              id="min_order"
              name="min_order"
              type="number"
              min="0"
              step="1"
              defaultValue={rupees(sale?.min_order_paise ?? null)}
              placeholder="None"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max_discount">Max. discount (₹)</Label>
            <Input
              id="max_discount"
              name="max_discount"
              type="number"
              min="0"
              step="1"
              defaultValue={rupees(sale?.max_discount_paise ?? null)}
              placeholder="No cap"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="usage_limit">Total uses</Label>
            <Input
              id="usage_limit"
              name="usage_limit"
              type="number"
              min="1"
              step="1"
              defaultValue={sale?.usage_limit ?? ''}
              placeholder="Unlimited"
            />
            <p className="text-xs text-muted-foreground">Across all customers.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          defaultChecked={sale?.is_active ?? true}
          className="h-4 w-4 accent-foreground"
        />
        <Label htmlFor="is_active" className="normal-case text-sm font-normal tracking-normal">
          Active — usable at checkout (within the date range)
        </Label>
      </div>

      {state && 'error' in state && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-3">
        <SubmitButton isEdit={isEdit} />
        <Button type="button" variant="outline" asChild>
          <a href="/admin/sales">Cancel</a>
        </Button>
      </div>
    </form>
  )
}
