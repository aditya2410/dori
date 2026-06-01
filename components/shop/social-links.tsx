import Link from 'next/link'
import { Instagram, Facebook, Youtube, Pin } from 'lucide-react'
import { getSocialLinks } from '@/lib/config'
import { cn } from '@/lib/utils'

// lucide-react does not have a Pinterest icon; Pin is used as the closest available substitute.
const ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  pinterest: Pin,
} as const

interface SocialLinksProps {
  className?: string
  iconClassName?: string
}

export function SocialLinks({ className, iconClassName }: SocialLinksProps) {
  const links = getSocialLinks()
  if (!links.length) return null

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {links.map((link) => {
        const Icon = ICONS[link.icon]
        return (
          <Link
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.name}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon className={cn('size-4', iconClassName)} />
          </Link>
        )
      })}
    </div>
  )
}
