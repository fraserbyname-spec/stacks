'use client'

import { useState, useEffect } from 'react'

type Score = {
  id: number
  player_name: string
  balance: number
  picks: number
  created_at: string
}

type PlayerRank = {
  rank: number
  player_name: string
  balance: number
  picks: number
}

export default function Leaderboard() {
  const [top10, setTop10] = useState<Score[]>([])
  const [playerRank, setPlayerRank] = useState<PlayerRank | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const player_id = localStorage.getItem('stacks_player_id') || ''
    fetch(`/api/scores?player_id=${player_id}`)
      .then(r => r.json())
      .then(data => {
        setTop10(data.top10 || [])
        setPlayerRank(data.playerRank || null)
        setLoading(false)
      })
  }, [])

  const formatBalance = (n: number) => `$${n.toLocaleString()}`

  return (
    <main className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm w-full max-w-sm p-8 flex flex-col gap-6">

        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1A2B3C] tracking-tight">STACKS</h1>
          <p className="text-[#7F8C8D] text-sm mt-1">The world&apos;s biggest stacks</p>
        </div>

        {loading ? (
          <p className="text-center text-[#7F8C8D] text-sm">Loading...</p>
        ) : top10.length === 0 ? (
          <p className="text-center text-[#7F8C8D] text-sm">No scores yet. Be the first!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {top10.map((score, index) => (
              <div key={score.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[#7F8C8D] text-sm w-6 text-right">#{index + 1}</span>
                  <span className="text-[#1A2B3C] font-medium text-sm">{score.player_name}</span>
                </div>
                <div className="text-right">
                  <p className="text-[#1A2B3C] font-bold text-sm">{formatBalance(score.balance)}</p>
                  <p className="text-[#7F8C8D] text-xs">{score.picks} picks</p>
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
                    <p className="text-[#7F8C8D] text-xs">{playerRank.picks} picks</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="border-t border-[#F4F6F8] pt-4 text-center">
          <a href="/" className="text-[#1A3A5A] text-xs underline">Back to game</a>
        </div>

      </div>
    </main>
  )
}