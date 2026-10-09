import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity'
import { supabaseAdmin, hashSecret, verifyPlayer } from '../../server'

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
})

const START_BALANCE = 50
const fail = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status })

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))

  if (body.action === 'create') {
    const name = String(body.name ?? '').trim().replace(/ {2,}/g, ' ')
    if (name.length < 2 || name.length > 16) return fail('Name must be 2 to 16 characters')
    if (!/^[A-Za-z0-9 _.-]+$/.test(name)) return fail('Use letters, numbers, spaces, _ . or - only')
    if (matcher.hasMatch(name)) return fail('Please choose a different name')

    const secret = randomBytes(32).toString('hex')
    const { data, error } = await supabaseAdmin
      .from('players')
      .insert({ name, secret_hash: hashSecret(secret), balance: START_BALANCE })
      .select('id, name, balance')
      .single()
    if (error || !data) return fail('Could not create player', 500)
    return NextResponse.json({ id: data.id, secret, name: data.name, balance: data.balance })
  }

  const player = await verifyPlayer(body.id, body.secret)
  if (!player) return fail('Unknown player', 401)

  if (body.action === 'load') {
    return NextResponse.json({ name: player.name, balance: player.balance })
  }

  if (body.action === 'restart') {
    // Only allowed when the balance is exactly 0.
    const { data } = await supabaseAdmin
      .from('players')
      .update({ balance: START_BALANCE, updated_at: new Date().toISOString() })
      .eq('id', player.id)
      .eq('balance', 0)
      .select('balance')
      .single()
    if (!data) return fail('You can only restart when you have $0')
    return NextResponse.json({ balance: data.balance })
  }

  return fail('Unknown action')
}