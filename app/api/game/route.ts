import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '../../supabase'

// Called when a new round starts — generates session server-side
export async function POST(request: Request) {
  const body = await request.json()
  const { player_id } = body

  if (!player_id) {
    return NextResponse.json({ error: 'Missing player_id' }, { status: 400 })
  }

  // Generate losing tile server-side — never sent to browser
  const losingTile = Math.floor(Math.random() * 5)
  const sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36)

  const { error } = await supabase
    .from('sessions')
    .insert([{
      session_id: sessionId,
      losing_tile: losingTile,
      used: false,
      player_id
    }])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

// Clean up sessions older than 24 hours
  await supabase
    .from('sessions')
    .delete()
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  // Only return session ID — losing tile stays on server
  return NextResponse.json({ sessionId })
}