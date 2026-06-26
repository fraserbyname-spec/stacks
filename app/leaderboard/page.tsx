'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Entry = {
  player_name: string
  time_ms: number
  errors: number
  streak: number
  player_id: string
}

type PlayerEntry = {
  rank: number
  player_name: string
  time_ms: number
  streak: number
  errors: number
}

export default function Leaderboard() {
  const [top10, setTop10] = useState<Entry[]>([])
  const [playerEntry, setPlayerEntry] = useState<PlayerEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const player_id = localStorage.getItem('bvs_player_id') || ''
    fetch(`/api/leaderboard?player_id=${player_id}`)
      .then(r => r.json())
      .then(data => {
        setTop10(data.top10 || [])
        setPlayerEntry(data.playerEntry || null)
        setLoading(false)
      })
  }, [])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const hundredths = Math.floor((ms % 1000) / 10)
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">

        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Leaderboard</h1>
          <p className="text-[#6B7280] text-sm mt-1">Highest streak wins — time breaks ties</p>
        </div>

        {loading ? (
          <p className="text-center text-[#6B7280] text-sm">Loading...</p>
        ) : top10.length === 0 ? (
          <p className="text-center text-[#6B7280] text-sm">No runs yet. Be the first!</p>
        ) : (
          <div className="flex flex-col gap-2">
            {top10.map((entry, i) => (
              <div key={entry.player_id} className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
                <div className="flex items-center gap-3">
                  <span className="text-[#6B7280] text-sm w-6 text-right">#{i + 1}</span>
                  <span className="text-[#1A1A1A] font-medium text-sm">{entry.player_name}</span>
                </div>
                <div className="text-right">
                  <p className="text-[#1A1A1A] font-bold text-sm">{entry.streak}/50</p>
                  <p className="text-[#6B7280] text-xs tabular-nums">{formatTime(entry.time_ms)}</p>
                </div>
              </div>
            ))}
            {playerEntry && (
              <>
                <div className="border-t-2 border-[#E5E7EB] my-1" />
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[#6B7280] text-sm w-6 text-right">#{playerEntry.rank}</span>
                    <span className="text-[#1A1A1A] font-bold text-sm">{playerEntry.player_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1A1A1A] font-bold text-sm">{playerEntry.streak}/50</p>
                    <p className="text-[#6B7280] text-xs tabular-nums">{formatTime(playerEntry.time_ms)}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={() => router.push('/game')}
          className="w-full bg-[#1A1A1A] text-white rounded-2xl py-4 font-bold text-base cursor-pointer active:scale-95 transition-all duration-100"
        >
          Play
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-[#F9FAFB] text-[#1A1A1A] rounded-2xl py-4 font-bold text-base cursor-pointer active:scale-95 transition-all duration-100"
        >
          Home
        </button>

      </div>
    </main>
  )
}