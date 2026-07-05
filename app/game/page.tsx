'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { playWrong, playSolve, playSubmit } from '../sounds'

const COLOURS = [
  { id: 'RED',    hex: '#E74C3C' },
  { id: 'BLUE',   hex: '#2980B9' },
  { id: 'YELLOW', hex: '#F1C40F' },
  { id: 'GREEN',  hex: '#27AE60' },
  { id: 'PURPLE', hex: '#8E44AD' },
  { id: 'ORANGE', hex: '#E67E22' },
  { id: 'WHITE',  hex: '#F5F5F5' },
  { id: 'TEAL',   hex: '#00BCD4' },
]

const INTEREST_RATES: Record<number, number> = {
  1: 0.04, 2: 0.035, 3: 0.03, 4: 0.025,
  5: 0.02, 6: 0.015, 7: 0.01, 8: 0.005,
}

type Guess = {
  colours: string[]
  correct: number
  misplaced: number
}

export default function Game() {
  const [current, setCurrent] = useState<string[]>([])
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [solved, setSolved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [balance, setBalance] = useState<number>(10)
  const router = useRouter()

  const getTodayKey = () => {
    const now = new Date()
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  }

  useEffect(() => {
    // Redirect if already played today
    const todayKey = getTodayKey()
    const todayData = localStorage.getItem(`stacks_result_${todayKey}`)
    if (todayData) { router.push('/'); return }
    const stored = localStorage.getItem('stacks_balance')
    if (stored) setBalance(Number(stored))
  }, [])

  const tapColour = (colourId: string) => {
    if (gameOver || current.length >= 4) return
    setCurrent(prev => [...prev, colourId])
  }

  const tapSlot = (index: number) => {
    if (gameOver) return
    setCurrent(prev => prev.filter((_, i) => i !== index))
  }

  const submitGuess = async () => {
    if (current.length !== 4 || submitting || gameOver) return
    setSubmitting(true)
    playSubmit()

    try {
      const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: current })
      })
      const data = await res.json()
      const newGuess: Guess = {
        colours: current,
        correct: data.correct,
        misplaced: data.misplaced
      }
      const newGuesses = [...guesses, newGuess]
      setGuesses(newGuesses)
      setCurrent([])

      if (data.solved) {
        setSolved(true)
        setGameOver(true)
        playSolve()
        finishGame(true, newGuesses.length)
      } else if (newGuesses.length >= 8) {
        setGameOver(true)
        playWrong()
        finishGame(false, 8)
      } else {
        playWrong()
      }
    } catch {
      // fail silently
    }
    setSubmitting(false)
  }

  const finishGame = (didSolve: boolean, attempts: number) => {
    const todayKey = getTodayKey()
    const interest = didSolve ? (INTEREST_RATES[attempts] ?? 0.005) : 0
    const currentBalance = Number(localStorage.getItem('stacks_balance') || 10)
    const earned = currentBalance * interest
    const newBalance = currentBalance + earned
    const puzzlesPlayed = Number(localStorage.getItem('stacks_puzzles_played') || 0) + 1

    localStorage.setItem('stacks_balance', String(newBalance))
    localStorage.setItem('stacks_puzzles_played', String(puzzlesPlayed))
    localStorage.setItem(`stacks_result_${todayKey}`, JSON.stringify({
      solved: didSolve,
      attempts,
      interest,
      earned,
      guesses: [...guesses, { colours: current, correct: 4, misplaced: 0 }]
        .map(g => ({ colours: g.colours, correct: g.correct, misplaced: g.misplaced }))
    }))

    setTimeout(() => router.push('/result'), didSolve ? 1500 : 500)
  }

  const colourHex = (id: string) => COLOURS.find(c => c.id === id)?.hex ?? '#333'

  return (
    <main className="min-h-screen bg-[#0F0F0F] flex flex-col">

      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-[#1A1A1A]">
        <button onClick={() => router.push('/')} className="text-[#666] text-sm">← Home</button>
        <h1 className="text-white font-bold text-lg">STACKS</h1>
        <p className="text-[#666] text-sm">{guesses.length} / 8</p>
      </div>

      {/* Guess grid */}
      <div className="flex-1 flex flex-col justify-center px-4 py-6 gap-2">
        {Array(8).fill(null).map((_, rowIdx) => {
          const guess = guesses[rowIdx]
          const isCurrentRow = rowIdx === guesses.length && !gameOver
          const colours = guess?.colours ?? (isCurrentRow ? current : [])

          return (
            <div key={rowIdx} className="flex items-center gap-2">
              {/* 4 colour slots */}
              <div className="flex gap-2 flex-1">
                {Array(4).fill(null).map((_, colIdx) => {
                  const colour = colours[colIdx]
                  return (
                    <div
                      key={colIdx}
                      onClick={() => isCurrentRow && colour ? tapSlot(colIdx) : undefined}
                      className="flex-1 h-12 rounded-xl border border-[#333] cursor-pointer transition-all duration-100"
                      style={{
                        backgroundColor: colour ? colourHex(colour) : '#1A1A1A',
                        borderColor: colour ? colourHex(colour) : '#333',
                      }}
                    />
                  )
                })}
              </div>

              {/* Feedback */}
              <div className="w-16 flex flex-col items-center justify-center">
                {guess ? (
                  <div className="text-xs text-center">
                    <span className="text-green-400 font-bold">🟢{guess.correct}</span>
                    <span className="text-orange-400 font-bold ml-1">🟠{guess.misplaced}</span>
                  </div>
                ) : isCurrentRow && current.length === 4 ? (
                  <button
                    onClick={submitGuess}
                    disabled={submitting}
                    className="bg-white text-[#0F0F0F] text-xs font-bold px-2 py-1 rounded-lg cursor-pointer active:scale-95 transition-all"
                  >
                    GO
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Colour palette */}
      {!gameOver && (
        <div className="px-4 pb-8">
          <div className="grid grid-cols-4 gap-3">
            {COLOURS.map(colour => (
              <button
                key={colour.id}
                onClick={() => tapColour(colour.id)}
                disabled={current.length >= 4 || current.includes(colour.id)}
                className="h-14 rounded-xl transition-all duration-100 active:scale-95 disabled:opacity-30"
                style={{ backgroundColor: colour.hex, border: colour.id === 'WHITE' ? '2px solid #444' : 'none' }}
              />
            ))}
          </div>
        </div>
      )}

    </main>
  )
}