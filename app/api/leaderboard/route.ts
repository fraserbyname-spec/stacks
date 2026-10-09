import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../server'

export const dynamic = 'force-dynamic'

type Row = { id: string; name: string; balance: number }

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id') ?? ''

  const { data } = await supabaseAdmin
    .from('players')
    .select('id, name, balance')
    .order('balance', { ascending: false })
    .order('updated_at', { ascending: true })
    .limit(10)

  const top = ((data ?? []) as Row[]).map((p, i) => ({
    rank: i + 1,
    name: p.name,
    balance: p.balance,
    isYou: p.id === id,
  }))

  let me = null
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const { data: player } = await supabaseAdmin
      .from('players')
      .select('name, balance')
      .eq('id', id)
      .single()
    if (player) {
      const { count } = await supabaseAdmin
        .from('players')
        .select('id', { count: 'exact', head: true })
        .gt('balance', player.balance)
      me = { name: player.name, balance: player.balance, rank: (count ?? 0) + 1 }
    }
  }

  return NextResponse.json({
    top,
    me,
    tenth: top.length === 10 ? top[9].balance : null,
  })
}