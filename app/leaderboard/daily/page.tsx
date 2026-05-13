'use client'

import { useState, useEffect } from 'react'

type Score = {
  id: number
  player_name: string
  balance: number
  picks: number
  date: string
}

type PlayerRank = {
  rank: number
  player_name: string
  balance: number
  picks: number
}

export default function DailyLeaderboard() {
  const [top10, setTop10] = useState<Score[]>([])
  const [playerRank, setPlayerRank] = useState<PlayerRank | null>(null)
  const [loading, setLoading] = useState(true)
  const [todayDate, setTodayDate] = useState('')

  useEffect(() => {
    const player_id = localStorage.getItem('stacks_player_id_v2') || ''
    const date = new Date().toLocaleDateString('en-NZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
    setTodayDate(date)

    fetch(`/api/leaderboard/daily?player_id=${player_id}`)
      .then(r => r.json())
      .then(data => {
        setTop10(data.top10 || [])
        setPlayerRank(data.playerRank || null)
        setLoading(false)
      })
  }, [])

  const formatBalance = (n: number) => {
    if (n >= 1000000000000000) {
      const q = n / 1000000000000000
      return `$${q % 1 === 0 ? q.toFixed(0) : q.toFixed(1)}Quadrillion`
    }
    if (n >= 1000000000000) {
      const t = n / 1000000000000
      return `$${t % 1 === 0 ? t.toFixed(0) : t.toFixed(1)}T`
    }
    if (n >= 1000000000) {
      const b = n / 1000000000
      return `$${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)}B`
    }
    if (n >= 1000000) {
      const m = n / 1000000
      return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
    }
    return `$${n.toLocaleString()}`
  }

  return (
    <main className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm w-full max-w-sm p-8 flex flex-col gap-6">

        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1A2B3C] tracking-tight">Today&apos;s Best Stackers</h1>
          <p className="text-[#7F8C8D] text-sm mt-1">{todayDate}</p>
          <p className="text-[#7F8C8D] text-xs mt-1">Refreshes daily at midday UTC</p>
        </div>

        {loading ? (
          <p className="text-center text-[#7F8C8D] text-sm">Loading...</p>
        ) : top10.length === 0 ? (
          <p className="text-center text-[#7F8C8D] text-sm">No scores yet today. Be the first!</p>
        ) : (
          <div className="flex flex-col gap-2">
            {top10.map((score, index) => (
              <div key={score.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[#7F8C8D] text-sm w-6 text-right">#{index + 1}</span>
                  <span className="text-[#1A2B3C] font-medium text-sm">{score.player_name}</span>
                </div>
                <div className="text-right">
                  <p className="text-[#1A2B3C] font-bold text-sm">{formatBalance(score.balance)}</p>
                  <p className="text-[#7F8C8D] text-xs">{score.picks} taps</p>
                </div>
              </div>
            ))}

            {playerRank && (
              <>
                <div className="border-t border-[#F4F6F8] my-1" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[#7F8C8D] text-sm w-6 text-right">#{playerRank.rank}</span>
                    <span className="text-[#1A2B3C] font-semibold text-sm">{playerRank.player_name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[#1A2B3C] font-bold text-sm">{formatBalance(playerRank.balance)}</p>
                    <p className="text-[#7F8C8D] text-xs">{playerRank.picks} taps</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="border-t border-[#F4F6F8] pt-4 text-center">
          <div className="flex justify-center gap-3">
            <a href="/leaderboard" className="text-[#3d5a80] text-sm font-semibold underline">World&apos;s Biggest Stackers</a>
            <span className="text-[#7F8C8D] text-base font-bold">·</span>
            <a href="/" className="text-[#3d5a80] text-sm font-semibold underline">Back to game</a>
          </div>
        </div>

      </div>
    </main>
  )
}