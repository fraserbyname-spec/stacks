'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { shuffleWithinTiers, type Verse } from '../verses'

type GameState = 'playing' | 'correct_flash' | 'failed' | 'complete'

export default function Game() {
  const [verses, setVerses] = useState<Verse[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<Verse[]>([])
  const [elapsedMs, setElapsedMs] = useState(0)
  const [started, setStarted] = useState(false)
  const [gameState, setGameState] = useState<GameState>('playing')
  const [correctFlash, setCorrectFlash] = useState(false)
  const [failedVerse, setFailedVerse] = useState<Verse | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [bestStreak, setBestStreak] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const router = useRouter()

  useEffect(() => {
    const name = localStorage.getItem('bvs_name')
    const streak = localStorage.getItem('bvs_best_streak')
    if (!name) { router.push('/'); return }
    setPlayerName(name)
    if (streak) setBestStreak(Number(streak))
    setVerses(shuffleWithinTiers())
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  const startTimer = () => {
    if (started) return
    setStarted(true)
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current)
    }, 10)
  }

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const hundredths = Math.floor((ms % 1000) / 10)
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`
  }

  const currentVerse = verses[currentIndex]

  const handleInput = (value: string) => {
    setInput(value)
    if (!started && value.length > 0) startTimer()
    if (value.length === 0) { setSuggestions([]); return }
    const lower = value.toLowerCase().replace(/\s/g, '')
    const matches = verses.filter(v => {
      const bookLower = v.book.toLowerCase().replace(/\s/g, '')
      return bookLower.startsWith(lower) ||
        v.searchTerms.some(t => t.startsWith(lower))
    })
    setSuggestions(matches)
  }

  const selectVerse = (verse: Verse) => {
    if (!currentVerse || gameState !== 'playing') return

    if (verse.id === currentVerse.id) {
      // Focus immediately inside the user gesture — works on mobile
      inputRef.current?.focus()
      setCorrectFlash(true)
      setGameState('correct_flash')
      setInput('')
      setSuggestions([])
      setTimeout(() => {
        setCorrectFlash(false)
        const nextIndex = currentIndex + 1
        if (nextIndex === verses.length) {
          stopTimer()
          const finalTime = Date.now() - startTimeRef.current
          setGameState('complete')
          router.push(`/complete?time=${finalTime}&streak=50&errors=0`)
        } else {
          setCurrentIndex(nextIndex)
          setGameState('playing')
          inputRef.current?.focus()
        }
      }, 600)

    } else {
      stopTimer()
      setFailedVerse(currentVerse)
      setGameState('failed')
      const finalTime = Date.now() - startTimeRef.current
      setTimeout(() => {
        router.push(`/complete?time=${finalTime}&streak=${currentIndex}&errors=1`)
      }, 3000)
    }
  }

  const tierColours: Record<string, string> = {
    EASY: 'bg-green-100 text-green-700',
    LESS_EASY: 'bg-blue-100 text-blue-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    HARD: 'bg-orange-100 text-orange-700',
    EXPERT: 'bg-red-100 text-red-700',
  }
  const tierLabels: Record<string, string> = {
    EASY: 'Easy', LESS_EASY: 'Less Easy', MEDIUM: 'Medium',
    HARD: 'Hard', EXPERT: 'Expert',
  }

  if (!currentVerse) return null

  const currentTier = currentVerse.tier

  return (
    <main className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between gap-4">
        <div className="text-center flex-1">
          <p className="text-[#6B7280] text-xs uppercase tracking-wider">Best</p>
          <p className="text-[#1A1A1A] text-base font-bold">
            {bestStreak !== null ? `${bestStreak}/50` : '--'}
          </p>
        </div>
        <div className="text-center flex-1">
          <p className="text-[#6B7280] text-xs uppercase tracking-wider">Streak</p>
          <p className="text-[#1A1A1A] text-xl font-bold">{currentIndex}/50</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-[#6B7280] text-xs uppercase tracking-wider">Time</p>
          <p className="text-[#1A1A1A] text-base font-bold tabular-nums">{formatTime(elapsedMs)}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 pt-6 gap-4">

        {/* Tier badge */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tierColours[currentTier]}`}>
            {tierLabels[currentTier]}
          </span>
          <span className="text-[#9CA3AF] text-xs">Verse {currentIndex + 1} of 50</span>
        </div>

        {/* Verse card */}
        <div className={`rounded-2xl p-5 transition-colors duration-200 ${
          correctFlash ? 'bg-green-50 border-2 border-green-400' :
          gameState === 'failed' ? 'bg-red-50 border-2 border-red-400' :
          'bg-[#F9FAFB]'
        }`}>
          {correctFlash && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-500 text-2xl">✓</span>
              <span className="text-green-600 font-semibold text-sm">
                {currentVerse.book} {currentVerse.chapter}:{currentVerse.verse}
              </span>
            </div>
          )}
          {gameState === 'failed' && failedVerse && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-red-500 text-2xl">✗</span>
              <div>
                <p className="text-red-600 font-semibold text-sm">The answer was:</p>
                <p className="text-red-700 font-bold">
                  {failedVerse.book} {failedVerse.chapter}:{failedVerse.verse}
                </p>
              </div>
            </div>
          )}
          <p className="text-lg leading-relaxed font-medium text-[#1A1A1A]">
            &ldquo;{currentVerse.text}&rdquo;
          </p>
        </div>

        {/* Input — always in DOM so focus works reliably */}
        <div
          className="relative"
          style={{ visibility: gameState === 'playing' || gameState === 'correct_flash' ? 'visible' : 'hidden' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => handleInput(e.target.value)}
            placeholder="Type book name..."
            className="w-full border-2 border-[#E5E7EB] focus:border-[#1A1A1A] rounded-xl px-4 py-4 text-[#1A1A1A] text-lg outline-none transition-colors"
          />
          {suggestions.length > 0 && gameState === 'playing' && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-40 overflow-hidden max-h-64 overflow-y-auto">
              {suggestions.map(verse => (
                <button
                  key={verse.id}
                  onClick={() => selectVerse(verse)}
                  className="w-full text-left px-4 py-3 text-[#1A1A1A] hover:bg-[#F9FAFB] border-b border-[#F3F4F6] last:border-0 transition-colors"
                >
                  <span className="font-semibold">{verse.book}</span>
                  <span className="text-[#6B7280] ml-2">{verse.chapter}:{verse.verse}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {gameState === 'failed' && (
          <p className="text-center text-[#9CA3AF] text-sm mt-2">Taking you to results...</p>
        )}

        {/* Progress bar */}
        <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 mt-2">
          <div
            className="bg-[#1A1A1A] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / 50) * 100}%` }}
          />
        </div>

      </div>
    </main>
  )
}