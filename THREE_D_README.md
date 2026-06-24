# 3D Experience

This branch upgrades the Dori storefront with a tasteful 3D layer while
preserving every piece of copy, route, and brand asset from the 2D site.

## What changed

| Surface | Before | After |
| --- | --- | --- |
| Home **Hero** | Flat hero image with text overlay | A WebGL plane displaying the same hero image with a subtle vertex-shader "fabric ripple", cursor parallax, and warm dust particles. Falls back to the original `<Image/>` when the device can't run it. |
| **Product Cards** (grids + Best Sellers carousel) | Static `next/image` tile | Cursor-tracking 3D tilt with a soft specular glare. CSS-3D only — no Three.js — so grids stay fast. |
| **About** page hero | Flat artisan photo + heading | Same photo + heading, layered with a floating cluster of iridescent pearls (R3F + `meshPhysicalMaterial`). |

All headlines, sub-headlines, CTAs, links, product data, and SEO metadata are unchanged.

## Auto 2D fallback

`lib/use-3d-support.ts` (`use3DSupport()`) returns `false` for any of:

* `prefers-reduced-motion: reduce`
* No WebGL / WebGL2 context available
* `navigator.deviceMemory ≤ 2 GB`
* `navigator.hardwareConcurrency ≤ 2`
* `navigator.connection.saveData === true`
* Effective connection type `2g` / `slow-2g`

When `false`, every 3D component renders the 2D version (or nothing, for the
About backdrop). The hook is also `null` during SSR so the page never flashes
a broken canvas.

## New files

```
lib/use-3d-support.ts                         WebGL + capability detection
components/three/hero-3d.tsx                  3D hero with 2D fallback (drop-in)
components/three/hero-3d-scene.tsx            R3F scene (shader plane + particles)
components/three/tilt-3d.tsx                  CSS-3D tilt wrapper for cards
components/three/about-pearls.tsx             Conditional pearls backdrop
components/three/about-scene.tsx              R3F floating-pearl scene
types/react-three-fiber.d.ts                  JSX augmentation for R3F v9 + React 19
```

## Modified files (minimal)

* `app/(shop)/page.tsx` — swaps `<Hero/>` for `<Hero3D/>` (identical copy)
* `app/(shop)/about/page.tsx` — adds `<AboutPearls/>` over the existing hero image
* `components/shop/product-card.tsx` — wraps the image tile in `<Tilt3D/>`
* `package.json` — adds `three`, `@react-three/fiber@^9`, `@react-three/drei@^10`, `@types/three`

The original `components/home/hero.tsx` is untouched — it remains available as the pure 2D component if you ever want to revert one page without touching others.

## Install

```bash
npm install
```

(or `yarn install`)

That pulls in:

```
three                  ^0.174.0
@react-three/fiber     ^9.6.1     (React 19 compatible)
@react-three/drei      ^10.1.1
@types/three           ^0.174.0
```

## Run

```bash
npm run dev
# open http://localhost:3000
```

On a desktop in a modern browser you'll see the new 3D hero ripple and
respond to your cursor. Add `?prefers-reduced-motion` to your OS / browser
to verify the 2D fallback kicks in.

## Performance notes

* Heavy R3F bundles are dynamically imported (`next/dynamic` with `ssr: false`) and only mounted **after** the support check passes — so low-end devices never even download the 3D code path beyond the tiny capability check.
* The hero scene caps DPR at 2, uses a single `ShaderMaterial`, and the particle field is < 250 points.
* The card tilt uses CSS transforms only (no WebGL), so grids of 50+ cards remain smooth.

## Branch

This work lives on `feature/3d-experience`. Merge to `main` once verified on staging.
