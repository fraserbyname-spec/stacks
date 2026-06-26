'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [nameInput, setNameInput] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [showNameEntry, setShowNameEntry] = useState(false)
  const [bestStreak, setBestStreak] = useState<number | null>(null)
  const [bestTime, setBestTime] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const name = localStorage.getItem('bvs_name')
    const streak = localStorage.getItem('bvs_best_streak')
    const time = localStorage.getItem('bvs_best_time')
    if (name) setPlayerName(name)
    else setShowNameEntry(true)
    if (streak) setBestStreak(Number(streak))
    if (time) setBestTime(Number(time))
  }, [])

  const saveName = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    localStorage.setItem('bvs_name', trimmed)
    setPlayerName(trimmed)
    setShowNameEntry(false)
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const hundredths = Math.floor((ms % 1000) / 10)
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">

      {showNameEntry && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Welcome</h2>
            <p className="text-[#6B7280] text-sm mb-6">What should we call you on the leaderboard?</p>
            <input
              type="text"
              maxLength={12}
              placeholder="Your name"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#1A1A1A] text-base outline-none focus:border-[#1A1A1A] mb-4"
            />
            <button
              onClick={saveName}
              className="w-full bg-[#1A1A1A] text-white rounded-xl py-3 font-semibold text-base"
            >
              Let&apos;s go
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col items-center gap-10">

        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#1A1A1A] tracking-tight">Bible Verse Sprint</h1>
          <p className="text-[#6B7280] text-base mt-3 leading-relaxed">
            Place all 50 verses. One mistake ends your run.
          </p>
        </div>

        <div className="w-full flex gap-4">
          <div className="flex-1 bg-[#F9FAFB] rounded-2xl p-5 text-center">
            <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wider mb-2">Your Best</p>
            <p className="text-[#1A1A1A] text-3xl font-bold">
              {bestStreak !== null ? `${bestStreak}/50` : '--'}
            </p>
          </div>
          <div className="flex-1 bg-[#F9FAFB] rounded-2xl p-5 text-center">
            <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wider mb-2">Best Time</p>
            <p className="text-[#1A1A1A] text-xl font-bold tabular-nums">
              {bestTime !== null ? formatTime(bestTime) : '--:--'}
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/game')}
          className="w-full bg-[#1A1A1A] text-white rounded-2xl py-5 font-bold text-xl tracking-wide cursor-pointer active:scale-95 transition-all duration-100"
        >
          START
        </button>

        <a href="/leaderboard" className="text-[#6B7280] text-sm underline">
          View leaderboard
        </a>

      </div>
    </main>
  )
}