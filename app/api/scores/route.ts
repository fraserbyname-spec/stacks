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

  // Insert this run into scores table
  await supabase
    .from('scores')
    .insert([{ player_name, balance, picks, player_id }])

  // Keep only top 10 runs in scores table
  const { data: top10 } = await supabase
    .from('scores')
    .select('id')
    .order('balance', { ascending: false })
    .limit(10)

  const top10Ids = top10?.map(s => s.id) ?? []

  if (top10Ids.length === 10) {
    // Delete any runs not in the top 10
    await supabase
      .from('scores')
      .delete()
      .not('id', 'in', `(${top10Ids.join(',')})`)
  }

  // Update personal bests table — one row per player
  const { data: existing } = await supabase
    .from('personal_bests')
    .select('*')
    .eq('player_id', player_id)
    .single()

  if (existing) {
    if (balance > existing.balance) {
      await supabase
        .from('personal_bests')
        .update({ balance, picks, player_name })
        .eq('player_id', player_id)
    }
  } else {
    await supabase
      .from('personal_bests')
      .insert([{ player_name, balance, picks, player_id }])
  }

  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const player_id = searchParams.get('player_id')

  // Top 10 runs
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
    // Get player's personal best
    const { data: playerBest } = await supabase
      .from('personal_bests')
      .select('*')
      .eq('player_id', player_id)
      .single()

    if (playerBest) {
      // Check if they're already in the top 10
      const inTop10 = top10?.some(s => s.player_id === player_id)

      if (!inTop10) {
        // Count personal bests better than theirs for rank
        const { count } = await supabase
          .from('personal_bests')
          .select('*', { count: 'exact', head: true })
          .gt('balance', playerBest.balance)

        playerRank = {
          rank: (count ?? 0) + 1,
          player_name: playerBest.player_name,
          balance: playerBest.balance,
          picks: playerBest.picks
        }
      }
    }
  }

  return NextResponse.json({ top10, playerRank })
}