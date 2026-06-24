/**
 * Quote/copy shown in the /experience scene.
 *
 * REUSE ONLY — every line here already exists verbatim on the 2D site
 * (lib/config.ts heroConfig and app/(shop)/about/page.tsx). No net-new content.
 * If the source copy changes, update it there and mirror it here.
 */
import { heroConfig } from '@/lib/config'

export type ExperienceQuote = {
  text: string
  /** Optional attribution line, e.g. the about-page signoff. */
  attribution?: string
}

export const experienceQuotes: ExperienceQuote[] = [
  // heroConfig.headline + subheadline (homepage hero)
  { text: heroConfig.headline, attribution: heroConfig.subheadline },
  // about/page.tsx — verbatim
  {
    text: 'Every bead, every stitch, every thread has been touched by hands that know this craft like a language.',
    attribution: '— Made in Jaipur',
  },
  {
    text: 'There is no factory floor. There are no shortcuts. Only an artisan, a handcrafted bag, and the time it takes to finish it properly.',
    attribution: '— The Dori Jaipur family',
  },
]
