import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Auth — admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await createServiceClient()
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { ext, contentType } = await request.json()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext ?? 'jpg'}`

  const service = createServiceClient()
  const { data, error } = await service.storage
    .from('product-images')
    .createSignedUploadUrl(path)

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create upload URL' }, { status: 500 })
  }

  const publicUrl = service.storage.from('product-images').getPublicUrl(path).data.publicUrl

  return NextResponse.json({ signedUrl: data.signedUrl, path, publicUrl })
}
