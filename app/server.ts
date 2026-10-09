import { createClient } from '@supabase/supabase-js'
import { createHash, timingSafeEqual } from 'crypto'

// Only used by files inside app/api (server code). Never import this in a page.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
)

export const hashSecret = (secret: string) =>
  createHash('sha256').update(secret).digest('hex')

export async function verifyPlayer(id: unknown, secret: unknown) {
  if (typeof id !== 'string' || typeof secret !== 'string') return null
  if (!/^[0-9a-f-]{36}$/i.test(id) || secret.length !== 64) return null

  const { data } = await supabaseAdmin
    .from('players')
    .select('id, name, balance, secret_hash')
    .eq('id', id)
    .single()
  if (!data) return null

  const a = Buffer.from(hashSecret(secret))
  const b = Buffer.from(data.secret_hash as string)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  return data as { id: string; name: string; balance: number; secret_hash: string }
}