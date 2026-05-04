import { NextResponse } from 'next/server'
import { supabase } from '../../supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { player_name, balance, picks, player_id } = body

  if (!player_name || !balance || !picks || !player_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Only store if balance is $32 or above
  if (balance < 32) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const { error } = await supabase
    .from('scores')
    .insert([{ player_name, balance, picks, player_id }])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  // Top 10 scores
  const { data: top10, error: top10Error } = await supabase
    .from('scores')
    .select('*')
    .order('balance', { ascending: false })
    .limit(10)

  if (top10Error) {
    return NextResponse.json({ error: top10Error.message }, { status: 500 })
  }

  return NextResponse.json({ top10 })
}