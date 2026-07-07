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
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        <div className="text-center">
          <h1 className="text-5xl font-bold text-[#1A1A1A] tracking-tight">STACKS</h1>
          <p className="text-[#6B7280] text-base mt-2">Build your stack. One puzzle a day.</p>
        </div>

        <div className="w-full bg-[#F9FAFB] rounded-2xl p-6 text-center">
          <p className="text-[#6B7280] text-xs uppercase tracking-widest mb-1">Balance</p>
          <p className="text-[#1A1A1A] text-5xl font-bold tabular-nums">{formatBalance(balance)}</p>
          <p className="text-[#9CA3AF] text-sm mt-2">{puzzlesPlayed} puzzle{puzzlesPlayed !== 1 ? 's' : ''} played</p>
        </div>

        {hasPlayedToday && todayResult ? (
          <div className="w-full flex flex-col gap-4">
            <div className="w-full bg-[#F9FAFB] rounded-2xl p-6 flex flex-col gap-3">
              <p className="text-[#1A1A1A] font-bold text-center text-base">
                {todayResult.solved ? 'Stack Complete ✓' : 'Stack Failed'}
              </p>
              {todayResult.solved ? (
                <>
                  <div className="flex justify-between text-base">
                    <span className="text-[#6B7280]">Attempts used</span>
                    <span className="text-[#1A1A1A] font-medium">{todayResult.attempts} / 8</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-[#6B7280]">Added</span>
                    <span className="text-green-600 font-medium">+{formatBalance(todayResult.earned)}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-[#6B7280]">Balance</span>
                    <span className="text-[#1A1A1A] font-bold">{formatBalance(balance)}</span>
                  </div>
                </>
              ) : (
                <p className="text-[#6B7280] text-base text-center">No growth today. Come back tomorrow.</p>
              )}
              <div className="border-t border-[#E5E7EB] pt-3 text-center">
                <p className="text-[#6B7280] text-sm">Next Stack in</p>
                <p className="text-[#1A1A1A] font-bold text-xl tabular-nums mt-1">{timeUntilNext}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/result')}
              className="w-full bg-[#1A1A1A] text-white rounded-2xl py-4 font-bold text-base cursor-pointer active:scale-95 transition-all duration-100"
            >
              Share Result
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            <button
              onClick={() => router.push('/game')}
              className="w-full bg-[#1A1A1A] text-white rounded-2xl py-5 font-bold text-xl cursor-pointer active:scale-95 transition-all duration-100"
            >
              Build Today&apos;s Stack
            </button>
          </div>
        )}

        <a href="/how-it-works" className="text-[#9CA3AF] text-sm underline">
          How it works
        </a>

      </div>
    </main>
  )
}