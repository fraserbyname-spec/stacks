'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CompleteContent() {
  const [rank, setRank] = useState<number | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [isNewBest, setIsNewBest] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const timeMs = Number(searchParams.get('time') || 0)
  const streak = Number(searchParams.get('streak') || 0)
  const errors = Number(searchParams.get('errors') || 0)
  const isPerfect = streak === 50 && errors === 0

  useEffect(() => {
    if (submitted) return
    setSubmitted(true)

    const playerName = localStorage.getItem('bvs_name') || 'Anonymous'
    let playerId = localStorage.getItem('bvs_player_id')
    if (!playerId) {
      playerId = Math.random().toString(36).slice(2)
      localStorage.setItem('bvs_player_id', playerId)
    }

    const prevBest = localStorage.getItem('bvs_best_streak')
    const prevBestNum = prevBest ? Number(prevBest) : 0
    if (streak > prevBestNum) {
      localStorage.setItem('bvs_best_streak', String(streak))
      setIsNewBest(true)
    }
    const prevBestTime = localStorage.getItem('bvs_best_time')
    if (!prevBestTime || timeMs < Number(prevBestTime)) {
      localStorage.setItem('bvs_best_time', String(timeMs))
    }

    fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_name: playerName, time_ms: timeMs, errors, streak, player_id: playerId })
    })
      .then(r => r.json())
      .then(data => { setRank(data.rank); setTotal(data.total) })
      .catch(() => {})
  }, [])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const hundredths = Math.floor((ms % 1000) / 10)
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`
  }

  const percentile = rank && total ? Math.round((1 - rank / total) * 100) : null

  const shareText = `𓂃 ོ✝︎𓂃\nStack Bible Verses\nScore: ${streak}/50\nTime: ${formatTime(timeMs)}${rank ? `\nWorld Rank: #${rank}` : ''}\n\nhttps://stacksgame.app`

  const handleShare = () => {
    if (navigator.share) navigator.share({ text: shareText })
    else { navigator.clipboard.writeText(shareText); alert('Copied!') }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {isPerfect && (
          <div className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-bold text-sm tracking-wide">
            🎯 PERFECT RUN
          </div>
        )}
        {isNewBest && !isPerfect && (
          <div className="bg-green-500 text-white px-6 py-2 rounded-full font-bold text-sm tracking-wide">
            NEW PERSONAL BEST
          </div>
        )}

        <h1 className="text-4xl font-bold text-[#1A1A1A]">
          {isPerfect ? 'Complete!' : 'Run Over'}
        </h1>

        <div className="w-full bg-[#F9FAFB] rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] text-sm">Streak</span>
            <span className="text-[#1A1A1A] text-xl font-bold">{streak}/50</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6B7280] text-sm">Time</span>
            <span className="text-[#1A1A1A] font-bold tabular-nums">{formatTime(timeMs)}</span>
          </div>
          
          {rank && (
            <>
              <div className="border-t border-[#E5E7EB] pt-4 flex justify-between items-center">
                <span className="text-[#6B7280] text-sm">World Rank</span>
                <span className="text-[#1A1A1A] font-bold">#{rank}</span>
              </div>
              {percentile !== null && percentile > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[#6B7280] text-sm">Percentile</span>
                  <span className="text-[#1A1A1A] font-bold">Top {100 - percentile}%</span>
                </div>
              )}
            </>
          )}
        </div>

        <button
          onClick={() => router.push('/game')}
          className="w-full bg-[#1A1A1A] text-white rounded-2xl py-4 font-bold text-base cursor-pointer active:scale-95 transition-all duration-100"
        >
          Play Again
        </button>
        <button
          onClick={() => router.push('/leaderboard')}
          className="w-full bg-[#F9FAFB] text-[#1A1A1A] rounded-2xl py-4 font-bold text-base cursor-pointer active:scale-95 transition-all duration-100"
        >
          Leaderboard
        </button>
        <button
          onClick={handleShare}
          className="w-full bg-[#F9FAFB] text-[#1A1A1A] rounded-2xl py-4 font-bold text-base cursor-pointer active:scale-95 transition-all duration-100"
        >
          Share Result
        </button>
        <button
          onClick={() => router.push('/')}
          className="text-[#6B7280] text-sm underline"
        >
          Home
        </button>

      </div>
    </main>
  )
}

export default function Complete() {
  return (
    <Suspense>
      <CompleteContent />
    </Suspense>
  )
}