import { Fragment } from 'react'

const ITEMS = ['Handmade in Jaipur', 'As seen on Instagram', 'Cash on Delivery']

export function TrustStrip() {
  return (
    <div className="flex items-center justify-center gap-3 md:gap-6 px-4 py-3 bg-accent/10 text-[11px] md:text-xs font-medium tracking-wide text-accent">
      {ITEMS.map((item, i) => (
        <Fragment key={item}>
          {i > 0 && (
            <span aria-hidden className="text-accent/40">
              ✦
            </span>
          )}
          <span className="whitespace-nowrap">{item}</span>
        </Fragment>
      ))}
    </div>
  )
}
