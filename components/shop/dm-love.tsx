import { dmQuotes, instagramConfig } from '@/lib/config'

interface Photo {
  id: string
  url: string
}

/**
 * "Straight from our DMs" — social proof for a young brand whose reviews
 * live in Instagram DMs. Real customer photos (community_photos table) +
 * DM-style quote bubbles. No invented star ratings or review counts.
 */
export function DmLove({ photos }: { photos: Photo[] }) {
  return (
    <section className="border-t pt-6 space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-lg font-medium">Straight from our DMs</h2>
        <a
          href={instagramConfig.url}
          target="_blank"
          rel="noopener noreferrer"
          data-track="dm-love-handle"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {instagramConfig.handle}
        </a>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-2">
        Real customer photos &amp; messages, shared with permission
      </p>

      {photos.length > 0 && (
        <div className="flex gap-2">
          {photos.slice(0, 3).map((photo) => (
            <div key={photo.id} className="w-16 h-20 shrink-0 overflow-hidden bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt="Dori customer photo"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
          <a
            href={instagramConfig.url}
            target="_blank"
            rel="noopener noreferrer"
            data-track="dm-love-more-photos"
            className="w-16 h-20 shrink-0 bg-secondary flex items-center justify-center text-center text-[10px] leading-tight text-muted-foreground hover:text-foreground transition-colors"
          >
            more on
            <br />
            IG ›
          </a>
        </div>
      )}

      <div className="space-y-2">
        {dmQuotes.map((quote) => (
          <figure
            key={quote.name}
            className="max-w-[90%] bg-secondary rounded-2xl rounded-bl-sm px-4 py-3 space-y-2"
          >
            <blockquote className="text-[13px] leading-relaxed">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <figcaption className="flex items-center gap-2 text-[11px]">
              <span
                aria-hidden
                className="w-5 h-5 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center"
              >
                {quote.name.charAt(0).toUpperCase()}
              </span>
              <span className="font-medium">{quote.name}</span>
              <span className="text-muted-foreground">· via Instagram DM</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <a
        href={instagramConfig.url}
        target="_blank"
        rel="noopener noreferrer"
        data-track="dm-love-see-more"
        className="inline-block text-xs font-medium text-accent hover:underline underline-offset-4"
      >
        See more love on {instagramConfig.handle} ›
      </a>
    </section>
  )
}
