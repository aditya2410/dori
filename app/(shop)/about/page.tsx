import type { Metadata } from 'next'
import Image from 'next/image'
import aboutImg from '@/public/images/aboutus.jpg'

export const metadata: Metadata = {
  alternates: { canonical: '/about' },
  title: 'About Dori Jaipur — Handcrafted Luxury Bags & Accessories from Jaipur',
  description:
    'Dori Jaipur is a Jaipur-based luxury accessories brand. We handcraft pearl bags, beaded clutches, crystal handbags, embroidered shirts and artisan keychains — made slowly, by skilled artisans in Jaipur, India.',
}

export default function AboutPage() {
  return (
    <>
      {/* ── Hero strip ── */}
      <section className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
        <Image
          src={aboutImg}
          placeholder="blur"
          alt="Dori Jaipur artisans handcrafting luxury bags in Jaipur"
          fill
          sizes="100vw"
          quality={90}
          priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <h1 className="font-serif text-5xl md:text-7xl font-light text-white tracking-tight">
            Made in Jaipur.
          </h1>
        </div>
      </section>

      {/* ── Body text ── */}
      <article className="mx-auto max-w-2xl px-6 py-24 md:py-32">

        <p className="font-serif text-lg md:text-xl leading-relaxed text-foreground mb-8">
          Dori Jaipur is a luxury accessories brand born in a small workshop in Jaipur — the kind
          of place where the light comes through wooden shutters and the air smells of leather,
          thread, and chai gone cold.
        </p>

        <p className="font-serif text-lg md:text-xl leading-relaxed text-foreground mb-8">
          We make handcrafted bags, pearl bags, beaded clutches, crystal handbags, embroidered
          shirts, and artisan keychains. Each piece begins as raw material — crystals, pearls,
          brass, thread — and ends as something you will carry for years.
        </p>

        <p className="font-serif text-lg md:text-xl leading-relaxed text-foreground mb-8">
          Every bead, every stitch, every thread in a Dori Jaipur piece has been touched by
          hands that know this craft like a language. Hands that belong mostly to women —
          homemakers in Jaipur who have turned their skill and patience into something they are
          proud of, earning on their own terms, without leaving their homes or their families.
        </p>

        <p className="font-serif text-lg md:text-xl leading-relaxed text-foreground mb-8">
          We do not call ourselves a brand. We are a workshop. There is no factory floor. There
          are no shortcuts. There is only an artisan, a handcrafted bag or keychain, and the time
          it takes to finish it properly.
        </p>

        <p className="font-serif text-lg md:text-xl leading-relaxed text-foreground mb-8">
          The artisans who make Dori Jaipur accessories live in Jaipur. They eat with their
          families at lunchtime. They earn fair wages. They take a week off for Diwali. They sit
          on the floor, sometimes with their children playing nearby, and they make things slowly,
          the way things ought to be made.
        </p>

        <p className="font-serif text-lg md:text-xl leading-relaxed text-foreground mb-8">
          When you carry a Dori Jaipur bag or wear one of our embroidered shirts, you are carrying
          their work — the love they put into a knot they retied three times to get right. The
          sweat of a summer afternoon in Jaipur. The quiet pride of someone who knows that what
          they made will outlast them.
        </p>

        <p className="font-serif text-lg md:text-xl leading-relaxed text-foreground mb-8">
          This is not just a bag. It is a small act of belief — that some things deserve to be
          made carefully, by real people, who are paid well, and given time.
        </p>

        <p className="font-serif text-lg md:text-xl leading-relaxed text-foreground mb-12">
          Thank you for being part of it.
        </p>

        <p className="font-serif italic text-base text-muted-foreground text-right">
          — The Dori Jaipur family
        </p>
      </article>
    </>
  )
}
