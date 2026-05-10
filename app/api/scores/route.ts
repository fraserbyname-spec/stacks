import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '../../supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { player_name, balance, picks, player_id } = body

  if (!player_name || !balance || !picks || !player_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (balance < 32) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Today's date in UTC YYYY-MM-DD format
  const today = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]

  const daily_only = body.daily_only === true

  // Update personal_bests — only if not daily_only
  if (!daily_only) {
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
  }

  // Update daily_scores — one row per player per day, best score only
  const { data: existingDaily } = await supabase
    .from('daily_scores')
    .select('*')
    .eq('player_id', player_id)
    .eq('date', today)
    .single()

  if (existingDaily) {
    if (balance > existingDaily.balance) {
      await supabase
        .from('daily_scores')
        .update({ balance, picks, player_name })
        .eq('player_id', player_id)
        .eq('date', today)
    }
  } else {
    await supabase
      .from('daily_scores')
      .insert([{ player_name, balance, picks, player_id, date: today }])
  }

  // Clean up daily_scores older than 48 hours
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0]
  await supabase
    .from('daily_scores')
    .delete()
    .lt('date', twoDaysAgo)

  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const player_id = searchParams.get('player_id')

  // Top 10 all time
  const { data: top10, error } = await supabase
    .from('personal_bests')
    .select('*')
    .order('balance', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let playerRank = null

  if (player_id) {
    const { data: playerScore } = await supabase
      .from('personal_bests')
      .select('*')
      .eq('player_id', player_id)
      .single()

    if (playerScore) {
      const inTop10 = top10?.some(s => s.player_id === player_id)

      if (!inTop10) {
        const { count } = await supabase
          .from('personal_bests')
          .select('*', { count: 'exact', head: true })
          .gt('balance', playerScore.balance)

        playerRank = {
          rank: (count ?? 0) + 1,
          player_name: playerScore.player_name,
          balance: playerScore.balance,
          picks: playerScore.picks
        }
      }
    }
  }

  return NextResponse.json({ top10, playerRank })
}