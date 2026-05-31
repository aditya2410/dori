'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-secondary flex items-center justify-center">
        <span className="font-serif text-3xl text-muted-foreground">DORI</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-[3/4] bg-secondary overflow-hidden relative">
        <Image
          src={images[active]}
          alt={productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
          className="object-cover transition-opacity duration-300"
          priority
        />
      </div>

      {/* Thumbnails — only show if more than one image */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`aspect-square bg-secondary overflow-hidden relative border-2 transition-colors ${
                active === i ? 'border-foreground' : 'border-transparent hover:border-foreground/30'
              }`}
            >
              <Image
                src={url}
                alt={`${productName} — view ${i + 1}`}
                fill
                sizes="10vw"
                unoptimized
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
