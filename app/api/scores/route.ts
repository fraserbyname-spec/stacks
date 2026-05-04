import { NextResponse } from 'next/server'
import { supabase } from '../../supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { player_name, balance, picks, player_id } = body

  if (!player_name || !balance || !picks || !player_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (balance < 32) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Check if player already has a score
  const { data: existing } = await supabase
    .from('scores')
    .select('*')
    .eq('player_id', player_id)
    .single()

  if (existing) {
    // Only update if new score is better
    if (balance > existing.balance) {
      await supabase
        .from('scores')
        .update({ balance, picks, player_name })
        .eq('player_id', player_id)
    }
  } else {
    // Insert new score
    await supabase
      .from('scores')
      .insert([{ player_name, balance, picks, player_id }])
  }

  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const player_id = searchParams.get('player_id')

  // Top 10
  const { data: top10, error } = await supabase
    .from('scores')
    .select('*')
    .order('balance', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let playerRank = null

  if (player_id) {
    // Get player's own score
    const { data: playerScore } = await supabase
      .from('scores')
      .select('*')
      .eq('player_id', player_id)
      .single()

    if (playerScore) {
      // Count how many scores are better
      const { count } = await supabase
        .from('scores')
        .select('*', { count: 'exact', head: true })
        .gt('balance', playerScore.balance)

      const rank = (count ?? 0) + 1
      const inTop10 = top10?.some(s => s.player_id === player_id)

      if (!inTop10) {
        playerRank = {
          rank,
          player_name: playerScore.player_name,
          balance: playerScore.balance,
          picks: playerScore.picks
        }
      }
    }
  }

  return NextResponse.json({ top10, playerRank })
}