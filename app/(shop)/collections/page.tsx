import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { BLUR_PLACEHOLDER } from '@/lib/utils'

export const metadata: Metadata = {
  alternates: { canonical: '/collections' },
  title: 'Collections',
  description: 'Explore our handcrafted collections, made in Jaipur.',
}

export default async function CollectionsPage() {
  const { data: seriesList } = await createServiceClient()
    .from('series')
    .select('id, slug, name, description, cover_image_url')
    .eq('is_active', true)
    .order('display_order')

  return (
    <div className="container py-16 md:py-24">
      <div className="text-center space-y-3 mb-16">
        <p className="font-sans text-xs tracking-[0.3em] text-muted-foreground uppercase">
          Collections
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-light">Our Collections</h1>
      </div>

      {!seriesList?.length ? (
        <p className="text-center text-muted-foreground">No collections available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {seriesList.map((s) => (
            <Link
              key={s.id}
              href={`/collections/${s.slug}`}
              className="group block space-y-4"
            >
              <div className="aspect-[3/4] bg-secondary overflow-hidden relative">
                {s.cover_image_url ? (
                  <Image
                    src={s.cover_image_url}
                    alt={s.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <span className="font-serif text-sm text-muted-foreground tracking-widest uppercase">
                      Dori
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-light">{s.name}</h2>
                {s.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                )}
                <p className="text-xs tracking-widest uppercase text-muted-foreground group-hover:text-foreground transition-colors pt-1">
                  Explore →
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
