import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '../../supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const player_id = searchParams.get('player_id')

  const { data: top10, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('streak', { ascending: false })
    .order('time_ms', { ascending: true })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let playerEntry = null

  if (player_id) {
    const { data: playerData } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('player_id', player_id)
      .single()

    if (playerData) {
      const inTop10 = top10?.some(s => s.player_id === player_id)
      if (!inTop10) {
        // Count players who rank better
        const { data: betterPlayers } = await supabase
          .from('leaderboard')
          .select('player_id, streak, time_ms')

        const rank = (betterPlayers ?? []).filter(p =>
          p.streak > playerData.streak ||
          (p.streak === playerData.streak && p.time_ms < playerData.time_ms)
        ).length + 1

        playerEntry = {
          rank,
          player_name: playerData.player_name,
          time_ms: playerData.time_ms,
          streak: playerData.streak,
          errors: playerData.errors
        }
      }
    }
  }

  return NextResponse.json({ top10: top10 ?? [], playerEntry })
}