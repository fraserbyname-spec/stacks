import { NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { supabaseAdmin, verifyPlayer } from '../../server'

export const dynamic = 'force-dynamic'

const fail = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status })

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))

  const player = await verifyPlayer(body.id, body.secret)
  if (!player) return fail('Unknown player', 401)

  const { wager, pick } = body
  if (pick !== 'red' && pick !== 'black') return fail('Pick red or black')
  if (!Number.isInteger(wager) || wager < 1 || wager > player.balance) {
    return fail('Invalid wager')
  }

  // THE ROLL. It happens only now, after the bet has arrived.
  // There is no seed, no stored sequence and no table of results anywhere,
  // so nothing exists to look up or predict beforehand.
  const result = randomInt(0, 2) === 0 ? 'red' : 'black'
  const won = result === pick

  const { data: balance, error } = await supabaseAdmin.rpc('apply_bet', {
    p_id: player.id,
    p_wager: wager,
    p_won: won,
  })
  if (error || balance === null) return fail('Bet could not be placed')

  return NextResponse.json({ result, won, balance })
}