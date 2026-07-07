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
  { id: 'BLACK',  hex: '#1A1A1A' },
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

const getTodayKey = () => {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
}

export default function Game() {
  const [current, setCurrent] = useState<(string | null)[]>([null, null, null, null])
  const [selectedSlot, setSelectedSlot] = useState<number | null>(0)
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winning, setWinning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [balance, setBalance] = useState<number>(10)
  const [loaded, setLoaded] = useState(false)
  const [winRowIndex, setWinRowIndex] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const todayKey = getTodayKey()
    const todayResult = localStorage.getItem(`stacks_result_${todayKey}`)
    if (todayResult) { router.push('/result'); return }
    const inProgress = localStorage.getItem(`stacks_inprogress_${todayKey}`)
    if (inProgress) {
      const saved = JSON.parse(inProgress)
      setGuesses(saved.guesses || [])
    }
    const stored = localStorage.getItem('stacks_balance')
    if (stored) setBalance(Number(stored))
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded || guesses.length === 0) return
    const todayKey = getTodayKey()
    localStorage.setItem(`stacks_inprogress_${todayKey}`, JSON.stringify({ guesses }))
  }, [guesses, loaded])

  const colourHex = (id: string) => COLOURS.find(c => c.id === id)?.hex ?? '#E5E7EB'

  // Tap a slot — select it for filling
  const tapSlot = (index: number) => {
    if (gameOver || winning) return
    setSelectedSlot(index)
  }

  // Tap a colour — fill selected slot
  const tapColour = (colourId: string) => {
    if (gameOver || winning || selectedSlot === null) return
    const next = [...current]
    next[selectedSlot] = colourId
    setCurrent(next)
    // Auto advance to next empty slot
    const nextEmpty = next.findIndex((c, i) => i > selectedSlot && c === null)
    if (nextEmpty !== -1) {
      setSelectedSlot(nextEmpty)
    } else {
      // Try wrapping to any empty slot
      const anyEmpty = next.findIndex(c => c === null)
      setSelectedSlot(anyEmpty !== -1 ? anyEmpty : null)
    }
  }

  const canSubmit = current.every(c => c !== null)

  const submitGuess = async () => {
    if (!canSubmit || submitting || gameOver || winning) return
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
        colours: current as string[],
        correct: data.correct,
        misplaced: data.misplaced
      }
      const newGuesses = [...guesses, newGuess]
      setGuesses(newGuesses)
      setCurrent([null, null, null, null])
      setSelectedSlot(0)

      if (data.solved) {
        setWinRowIndex(newGuesses.length - 1)
        setWinning(true)
        setGameOver(true)
        playSolve()
        setTimeout(() => finishGame(true, newGuesses.length, newGuesses), 2500)
      } else if (newGuesses.length >= 8) {
        setGameOver(true)
        playWrong()
        setTimeout(() => finishGame(false, 8, newGuesses), 800)
      } else {
        playWrong()
      }
    } catch {
      // fail silently
    }
    setSubmitting(false)
  }

  const finishGame = (didSolve: boolean, attempts: number, finalGuesses: Guess[]) => {
    const todayKey = getTodayKey()
    const interest = didSolve ? (INTEREST_RATES[attempts] ?? 0.005) : 0
    const currentBalance = Number(localStorage.getItem('stacks_balance') || 10)
    const earned = currentBalance * interest
    const newBalance = currentBalance + earned
    const puzzlesPlayed = Number(localStorage.getItem('stacks_puzzles_played') || 0) + 1
    localStorage.setItem('stacks_balance', String(newBalance))
    localStorage.setItem('stacks_puzzles_played', String(puzzlesPlayed))
    localStorage.setItem(`stacks_result_${todayKey}`, JSON.stringify({
      solved: didSolve, attempts, interest, earned, guesses: finalGuesses
    }))
    localStorage.removeItem(`stacks_inprogress_${todayKey}`)
    router.push('/result')
  }

  if (!loaded) return null

  return (
    <main className={`h-screen flex flex-col overflow-hidden transition-colors duration-700 ${winning ? 'bg-green-50' : 'bg-white'}`}>

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#E5E7EB] shrink-0">
        <button onClick={() => router.push('/')} className="text-[#6B7280] text-sm">← Home</button>
        <h1 className="text-[#1A1A1A] font-bold text-base">STACKS</h1>
        <p className="text-[#6B7280] text-sm">{guesses.length} / 8</p>
      </div>

      {/* Instruction */}
      <div className="px-4 pt-2 pb-1 shrink-0">
        <p className="text-[#9CA3AF] text-sm text-center">
          Stack the colours to find the correct combination.
        </p>
      </div>

      {/* Guess grid */}
      <div className="flex-1 flex flex-col justify-center px-4 gap-1.5 min-h-0">
        {Array(8).fill(null).map((_, rowIdx) => {
          const guess = guesses[rowIdx]
          const isCurrentRow = rowIdx === guesses.length && !gameOver
          const isWinRow = winRowIndex === rowIdx

          return (
            <div
              key={rowIdx}
              className={`flex items-center gap-2 ${isWinRow ? 'animate-pop-in' : ''}`}
            >
              <div className="flex gap-1.5 flex-1">
                {Array(4).fill(null).map((_, colIdx) => {
                  const guessColour = guess?.colours[colIdx]
                  const currentColour = isCurrentRow ? current[colIdx] : null
                  const colour = guessColour ?? currentColour
                  const isSelected = isCurrentRow && selectedSlot === colIdx && !gameOver

                  return (
                    <div
                      key={colIdx}
                      onClick={() => isCurrentRow ? tapSlot(colIdx) : undefined}
                      className={`flex-1 h-10 rounded-lg border-2 transition-all duration-100 ${
                        isCurrentRow ? 'cursor-pointer' : ''
                      } ${isSelected ? 'border-[#1A1A1A] scale-105' : 'border-[#E5E7EB]'}`}
                      style={{
                        backgroundColor: colour ? colourHex(colour) : '#F9FAFB',
                      }}
                    />
                  )
                })}
              </div>

              {/* Feedback */}
              <div className="w-16 flex items-center justify-center gap-0.5">
                {guess ? (
                  <>
                    <span className="text-green-600 font-bold text-sm">🟢{guess.correct}</span>
                    <span className="text-orange-500 font-bold text-sm">🟠{guess.misplaced}</span>
                  </>
                ) : isCurrentRow && canSubmit ? (
                  <button
                    onClick={submitGuess}
                    disabled={submitting}
                    className="bg-[#1A1A1A] text-white text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer active:scale-95 transition-all"
                  >
                    GO
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Win message */}
      {winning && (
        <div className="px-4 py-2 text-center shrink-0">
          <p className="text-green-600 text-base font-bold animate-pop-in">Stack locked in! ✓</p>
        </div>
      )}

      {/* Colour palette */}
      {!gameOver && (
        <div className="px-4 pt-2 pb-4 border-t border-[#E5E7EB] shrink-0">
          <div className="grid grid-cols-4 gap-2">
            {COLOURS.map(colour => {
              const alreadyUsed = current.includes(colour.id)
              return (
                <button
                  key={colour.id}
                  onClick={() => tapColour(colour.id)}
                  disabled={alreadyUsed || selectedSlot === null}
                  className={`h-12 rounded-xl transition-all duration-100 active:scale-95 ${
                    alreadyUsed ? 'opacity-25' : 'opacity-100'
                  }`}
                  style={{
                    backgroundColor: colour.hex,
                    border: colour.id === 'BLACK' ? '2px solid #D1D5DB' : 'none'
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

    </main>
  )
}