import { NextResponse } from 'next/server'
import { supabase } from '../../../supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { session_id, chosen_tile, player_id } = body

  if (!session_id || chosen_tile === undefined || !player_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Fetch session from server
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('session_id', session_id)
    .eq('player_id', player_id)
    .eq('used', false)
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
  }

  // Mark session as used immediately — prevents replay attacks
  await supabase
    .from('sessions')
    .update({ used: true })
    .eq('session_id', session_id)

  const isLose = chosen_tile === session.losing_tile
  const losingTile = session.losing_tile

  return NextResponse.json({ isLose, losingTile })
}