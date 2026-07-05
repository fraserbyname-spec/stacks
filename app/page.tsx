'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [balance, setBalance] = useState<number>(10)
  const [puzzlesPlayed, setPuzzlesPlayed] = useState<number>(0)
  const [hasPlayedToday, setHasPlayedToday] = useState(false)
  const [todayResult, setTodayResult] = useState<{
    solved: boolean
    attempts: number
    interest: number
    earned: number
  } | null>(null)
  const [timeUntilNext, setTimeUntilNext] = useState('')
  const router = useRouter()

  const getTodayKey = () => {
    const now = new Date()
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  }

  const formatBalance = (n: number) => {
    if (n >= 1000) return `$${Math.round(n).toLocaleString()}`
    return `$${n.toFixed(2)}`
  }

  const formatInterest = (rate: number) => `+${(rate * 100).toFixed(1)}%`

  useEffect(() => {
    const stored = localStorage.getItem('stacks_balance')
    const played = localStorage.getItem('stacks_puzzles_played')
    const todayKey = getTodayKey()
    const todayData = localStorage.getItem(`stacks_result_${todayKey}`)

    if (stored) setBalance(Number(stored))
    if (played) setPuzzlesPlayed(Number(played))
    if (todayData) {
      setHasPlayedToday(true)
      setTodayResult(JSON.parse(todayData))
    }
  }, [])

  // Countdown to next puzzle
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const next = new Date()
      next.setUTCHours(24, 0, 0, 0)
      const diff = next.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeUntilNext(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      )
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white tracking-tight">STACKS</h1>
          <p className="text-[#666] text-sm mt-2">Build a Stack every day. Grow your balance forever.</p>
        </div>

        {/* Balance */}
        <div className="w-full bg-[#1A1A1A] rounded-2xl p-6 text-center">
          <p className="text-[#666] text-xs uppercase tracking-widest mb-1">Balance</p>
          <p className="text-white text-5xl font-bold tabular-nums">{formatBalance(balance)}</p>
          <p className="text-[#444] text-xs mt-2">{puzzlesPlayed} puzzle{puzzlesPlayed !== 1 ? 's' : ''} played</p>
        </div>

        {/* Today's state */}
        {hasPlayedToday && todayResult ? (
          <div className="w-full bg-[#1A1A1A] rounded-2xl p-6 flex flex-col gap-3">
            <p className="text-white font-bold text-center">
              {todayResult.solved ? 'Stack Complete ✓' : 'Stack Failed'}
            </p>
            {todayResult.solved ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Attempts used</span>
                  <span className="text-white font-medium">{todayResult.attempts} / 8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Interest earned</span>
                  <span className="text-green-400 font-medium">{formatInterest(todayResult.interest)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Today's gain</span>
                  <span className="text-green-400 font-medium">+{formatBalance(todayResult.earned)}</span>
                </div>
              </>
            ) : (
              <p className="text-[#666] text-sm text-center">No growth today. Come back tomorrow.</p>
            )}
            <div className="border-t border-[#333] pt-3 text-center">
              <p className="text-[#666] text-xs">Next Stack in</p>
              <p className="text-white font-bold text-xl tabular-nums mt-1">{timeUntilNext}</p>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            <div className="w-full bg-[#1A1A1A] rounded-2xl p-4 text-center">
              <p className="text-[#666] text-xs uppercase tracking-widest mb-1">Today&apos;s reward range</p>
              <p className="text-white font-bold">+0.5% → +4.0%</p>
            </div>
            <button
              onClick={() => router.push('/game')}
              className="w-full bg-white text-[#0F0F0F] rounded-2xl py-5 font-bold text-xl cursor-pointer active:scale-95 transition-all duration-100"
            >
              Build Today&apos;s Stack
            </button>
          </div>
        )}

        {/* How it works */}
        <a href="/how-it-works" className="text-[#444] text-sm underline">
          How it works
        </a>

      </div>
    </main>
  )
}