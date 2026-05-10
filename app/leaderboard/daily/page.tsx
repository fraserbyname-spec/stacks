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

  const formatBalance = (n: number) => `$${n.toLocaleString()}`

  const Row = ({ rank, player_name, balance, picks, highlight = false }: {
    rank: number
    player_name: string
    balance: number
    picks: number
    highlight?: boolean
  }) => (
    <div className={`flex items-center gap-2 py-1 ${highlight ? 'font-semibold' : ''}`}>
      <span className="text-[#7F8C8D] text-sm w-7 shrink-0 text-right">#{rank}</span>
      <span className="text-[#1A2B3C] text-sm truncate flex-1 min-w-0">{player_name}</span>
      <span className="text-[#1A2B3C] text-sm font-bold shrink-0">{formatBalance(balance)}</span>
      <span className="text-[#7F8C8D] text-xs shrink-0 w-16 text-right">in {picks} picks</span>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm w-full max-w-sm p-8 flex flex-col gap-6">

        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1A2B3C] tracking-tight">Today&apos;s Best Stackers</h1>
          <p className="text-[#7F8C8D] text-sm mt-1">{todayDate}</p>
          <p className="text-[#7F8C8D] text-xs mt-1">Refreshes daily at midnight NZT</p>
        </div>

        {loading ? (
          <p className="text-center text-[#7F8C8D] text-sm">Loading...</p>
        ) : top10.length === 0 ? (
          <p className="text-center text-[#7F8C8D] text-sm">No scores yet today. Be the first!</p>
        ) : (
          <div className="flex flex-col gap-1">
            {top10.map((score, index) => (
              <Row
                key={score.id}
                rank={index + 1}
                player_name={score.player_name}
                balance={score.balance}
                picks={score.picks}
              />
            ))}

            {playerRank && (
              <>
                <div className="border-t border-[#F4F6F8] my-2" />
                <Row
                  rank={playerRank.rank}
                  player_name={playerRank.player_name}
                  balance={playerRank.balance}
                  picks={playerRank.picks}
                  highlight
                />
              </>
            )}
          </div>
        )}

        <div className="border-t border-[#F4F6F8] pt-4 text-center space-y-2">
          <div className="flex justify-center gap-3">
            <a href="/leaderboard" className="text-[#3d5a80] text-sm font-semibold underline">World&apos;s Biggest Stackers</a>
            <span className="text-[#7F8C8D] text-sm">·</span>
            <a href="/" className="text-[#3d5a80] text-sm font-semibold underline">Back to game</a>
          </div>
        </div>

      </div>
    </main>
  )
}