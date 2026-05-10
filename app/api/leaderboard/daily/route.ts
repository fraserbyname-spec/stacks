import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '../../../supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const player_id = searchParams.get('player_id')

  const today = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: top10, error } = await supabase
    .from('daily_scores')
    .select('*')
    .eq('date', today)
    .order('balance', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let playerRank = null

  if (player_id) {
    const { data: playerScore } = await supabase
      .from('daily_scores')
      .select('*')
      .eq('player_id', player_id)
      .eq('date', today)
      .single()

    if (playerScore) {
      const inTop10 = top10?.some(s => s.player_id === player_id)

      if (!inTop10) {
        const { count } = await supabase
          .from('daily_scores')
          .select('*', { count: 'exact', head: true })
          .gt('balance', playerScore.balance)
          .eq('date', today)

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