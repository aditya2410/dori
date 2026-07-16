import { instagramConfig } from '@/lib/config'

// Store is on a short break. This bar auto-hides once the return date passes, so
// it can't linger as a stale "we're away" notice. To extend the break, bump
// BACK_BY; to reopen early, delete this component + its use in
// app/(shop)/layout.tsx.
const BACK_BY = new Date('2026-08-01T00:00:00+05:30') // 1 Aug 2026, IST

export function BreakBanner() {
  if (Date.now() >= BACK_BY.getTime()) return null

  return (
    <div className="bg-[#1a1a1a] px-4 py-2.5 text-center text-[12px] leading-snug text-white sm:text-[13px]">
      <span className="tracking-wide">
        Dori is on a short break — back by 1 August. To place an order now, DM us on Instagram{' '}
        <a
          href={instagramConfig.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-2 hover:opacity-80"
        >
          {instagramConfig.handle}
        </a>
      </span>
    </div>
  )
}
