'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const COLOUR_HEX: Record<string, string> = {
  RED: '#E74C3C', BLUE: '#2980B9', YELLOW: '#F1C40F',
  GREEN: '#27AE60', PURPLE: '#8E44AD', ORANGE: '#E67E22',
  WHITE: '#F5F5F5', TEAL: '#00BCD4',
}

export default function Result() {
  const [result, setResult] = useState<{
    solved: boolean
    attempts: number
    interest: number
    earned: number
    guesses: { colours: string[], correct: number, misplaced: number }[]
  } | null>(null)
  const [balance, setBalance] = useState<number>(10)
  const router = useRouter()

  const getTodayKey = () => {
    const now = new Date()
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  }

  useEffect(() => {
    const todayKey = getTodayKey()
    const todayData = localStorage.getItem(`stacks_result_${todayKey}`)
    const stored = localStorage.getItem('stacks_balance')
    if (!todayData) { router.push('/'); return }
    setResult(JSON.parse(todayData))
    if (stored) setBalance(Number(stored))
  }, [])

  const formatBalance = (n: number) => {
    if (n >= 1000) return `$${Math.round(n).toLocaleString()}`
    return `$${n.toFixed(2)}`
  }

  const formatInterest = (rate: number) => `+${(rate * 100).toFixed(1)}%`

  const getShareText = () => {
    if (!result) return ''
    const todayKey = getTodayKey()
    const rows = result.guesses.map(g => {
      const greens = Array(g.correct).fill('🟢')
      const oranges = Array(g.misplaced).fill('🟠')
      const blacks = Array(4 - g.correct - g.misplaced).fill('⬛')
      return [...greens, ...oranges, ...blacks].join('')
    }).join('\n')
    return `STACKS — ${todayKey}\n\n${rows}\n\n${result.solved ? `Solved in ${result.attempts} attempt${result.attempts !== 1 ? 's' : ''}. ${formatInterest(result.interest)} growth.` : 'No Stack today.'}\nstacksgame.app`
  }

  const handleShare = () => {
    const text = getShareText()
    if (navigator.share) navigator.share({ text })
    else { navigator.clipboard.writeText(text); alert('Copied!') }
  }

  if (!result) return null

  return (
    <main className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        <h1 className="text-white text-3xl font-bold">
          {result.solved ? 'Stack Complete ✓' : 'Stack Failed'}
        </h1>

        {/* Guess replay */}
        <div className="w-full flex flex-col gap-2">
          {result.guesses.map((guess, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex gap-1.5 flex-1">
                {guess.colours.map((colour, j) => (
                  <div
                    key={j}
                    className="flex-1 h-10 rounded-lg"
                    style={{
                      backgroundColor: COLOUR_HEX[colour] ?? '#333',
                      border: colour === 'WHITE' ? '1px solid #444' : 'none'
                    }}
                  />
                ))}
              </div>
              <div className="w-14 text-xs text-center">
                <span className="text-green-400 font-bold">🟢{guess.correct}</span>
                <span className="text-orange-400 font-bold ml-1">🟠{guess.misplaced}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="w-full bg-[#1A1A1A] rounded-2xl p-5 flex flex-col gap-3">
          {result.solved ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">Attempts</span>
                <span className="text-white font-medium">{result.attempts} / 8</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">Interest rate</span>
                <span className="text-green-400 font-medium">{formatInterest(result.interest)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">Earned today</span>
                <span className="text-green-400 font-medium">+{formatBalance(result.earned)}</span>
              </div>
              <div className="border-t border-[#333] pt-3 flex justify-between text-sm">
                <span className="text-[#666]">New balance</span>
                <span className="text-white font-bold">{formatBalance(balance)}</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-[#666] text-sm text-center">No growth today.</p>
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">Balance unchanged</span>
                <span className="text-white font-medium">{formatBalance(balance)}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={handleShare}
          className="w-full bg-white text-[#0F0F0F] rounded-2xl py-4 font-bold text-base cursor-pointer active:scale-95 transition-all duration-100"
        >
          Share Result
        </button>
        <button
          onClick={() => router.push('/')}
          className="text-[#666] text-sm underline"
        >
          Home
        </button>

      </div>
    </main>
  )
}