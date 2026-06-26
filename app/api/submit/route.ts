import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '../../supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { player_name, time_ms, errors, streak, player_id } = body

  if (!player_name || player_id === undefined || streak === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('player_id', player_id)
    .single()

  const isBetter = !existing ||
    streak > existing.streak ||
    (streak === existing.streak && time_ms < existing.time_ms)

  if (existing) {
    if (isBetter) {
      await supabase
        .from('leaderboard')
        .update({ time_ms, errors, streak, player_name })
        .eq('player_id', player_id)
    }
  } else {
    await supabase
      .from('leaderboard')
      .insert([{ player_name, time_ms, errors, streak, player_id }])
  }

  // Get rank — higher streak is better, lower time breaks ties
  const { count } = await supabase
    .from('leaderboard')
    .select('*', { count: 'exact', head: true })
    .or(`streak.gt.${streak},and(streak.eq.${streak},time_ms.lt.${time_ms})`)

  const rank = (count ?? 0) + 1

  const { count: total } = await supabase
    .from('leaderboard')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({ ok: true, rank, total: total ?? 1 })
}