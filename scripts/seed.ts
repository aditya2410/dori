import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// Placeholder images use the DORI brand palette (off-white bg, dark text)
const placeholder = (color: string) =>
  `https://placehold.co/800x1067/${color}/1a1a1a?text=DORI`

const products = [
  {
    slug: 'hand-stitched-leather-journal',
    name: 'Hand-stitched Leather Journal',
    description:
      'Bound in full-grain vegetable-tanned leather and hand-stitched with waxed linen thread. Each piece develops a unique patina over time. 192 pages of cream acid-free paper, thread-sewn for durability.',
    price_paise: 389900,
    stock: 12,
    is_active: true,
    images: [placeholder('f5f0eb'), placeholder('ede6dc')],
  },
  {
    slug: 'silk-hand-painted-scarf',
    name: 'Silk Hand-painted Scarf',
    description:
      'Hand-painted on pure mulberry silk using natural pigments. No two scarves are alike — each one carries the hand of its maker. Finished with hand-rolled edges and presented in our signature linen wrap.',
    price_paise: 849900,
    stock: 8,
    is_active: true,
    images: [placeholder('e8e0d8'), placeholder('ddd4c8')],
  },
  {
    slug: 'handthrown-ceramic-mug-set',
    name: 'Handthrown Ceramic Mug Set',
    description:
      'A set of two stoneware mugs thrown on the wheel and glazed in a bone-white finish. Each holds 320 ml. Dishwasher and microwave safe. Slight variations in form and glaze are a mark of the handmade.',
    price_paise: 299900,
    stock: 20,
    is_active: true,
    images: [placeholder('d8d0c4'), placeholder('cec6ba')],
  },
  {
    slug: 'stonewashed-linen-cushion-cover',
    name: 'Stonewashed Linen Cushion Cover',
    description:
      'Handwoven in Belgium from 100% stonewashed linen. Softens beautifully with every wash. Hidden zip closure. Fits a standard 45×45 cm insert (not included).',
    price_paise: 249900,
    stock: 15,
    is_active: true,
    images: [placeholder('c8bfb4'), placeholder('bdb5aa')],
  },
  {
    slug: 'solid-brass-taper-holder',
    name: 'Solid Brass Taper Holder',
    description:
      'Cast in solid brass and hand-finished with a brushed matte surface. Accepts standard taper candles. A quiet, enduring object that anchors any surface. Weight: 280 g.',
    price_paise: 189900,
    stock: 30,
    is_active: true,
    images: [placeholder('b8ad9e'), placeholder('ada395')],
  },
]

async function seed() {
  console.log(`Seeding ${products.length} products…\n`)

  for (const product of products) {
    const { error } = await supabase
      .from('products')
      .upsert(product, { onConflict: 'slug' })

    if (error) {
      console.error(`✗ ${product.name}:`, error.message)
    } else {
      console.log(`✓ ${product.name}`)
    }
  }

  console.log('\nDone.')
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
