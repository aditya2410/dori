/**
 * A horizontal infinite-scrolling marquee of the brand's recurring
 * words. Pure CSS using the existing `marquee` keyframes already in
 * tailwind.config (used by the SaleBanner). Respects reduced-motion via
 * `motion-reduce` Tailwind variant.
 */
const WORDS = [
  'HANDCRAFTED IN JAIPUR',
  'PEARLS',
  'BEADWORK',
  'NO SHORTCUTS',
  'FAIR WAGES',
  'MADE SLOWLY',
  'SINCE 2023',
]

export function MarqueeWords() {
  // Duplicate the list so the loop seam is invisible.
  const items = [...WORDS, ...WORDS]
  return (
    <section
      data-testid="marquee-words"
      aria-hidden
      className="relative bg-[hsl(40_20%_97%)] py-10 md:py-16 border-y border-border overflow-hidden select-none"
    >
      <div className="flex w-max animate-[marquee_40s_linear_infinite] motion-reduce:animate-none gap-16 px-8">
        {items.map((w, i) => (
          <div key={i} className="flex items-center gap-16 shrink-0">
            <span className="font-serif text-4xl md:text-7xl font-light tracking-tight whitespace-nowrap text-foreground">
              {w}
            </span>
            <span className="text-[#caa472] text-3xl md:text-5xl">✦</span>
          </div>
        ))}
      </div>
    </section>
  )
}
