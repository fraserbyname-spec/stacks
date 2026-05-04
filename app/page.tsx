'use client'

import { useState, useEffect, useRef } from 'react'
import { playTileTap, playPulseBeat, playTileRevealWin, playTileRevealLose, playBalanceUpdate, playRunOver } from './sounds'

type GameState = 'idle' | 'playing' | 'pulsing' | 'revealing' | 'dead' | 'waiting'

export default function Home() {
  const [balance, setBalance] = useState(1)
  const [picks, setPicks] = useState(0)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [losingTile, setLosingTile] = useState<number>(-1)
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const [revealedTiles, setRevealedTiles] = useState<(false | 'win' | 'lose')[]>(Array(5).fill(false))
  const [pulseActive, setPulseActive] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [showNameModal, setShowNameModal] = useState(false)
  const [bestBalance, setBestBalance] = useState(1)
  const [bestPicks, setBestPicks] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [hasPlayedBefore, setHasPlayedBefore] = useState(false)
  const [hasPickedThisSession, setHasPickedThisSession] = useState(false)
  const [showShareButton, setShowShareButton] = useState(false)
  const [lastRunBalance, setLastRunBalance] = useState(0)
  const [lastRunPicks, setLastRunPicks] = useState(0)
  const [shimmerKey, setShimmerKey] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearAllTimers = () => {
    timers.current.forEach(t => clearTimeout(t))
    timers.current = []
  }

  const addTimer = (fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay)
    timers.current.push(t)
    return t
  }

  useEffect(() => {
    const name = localStorage.getItem('stacks_name')
    const best = localStorage.getItem('stacks_best')
    const bestP = localStorage.getItem('stacks_best_picks')
    const games = localStorage.getItem('stacks_games')
    const played = localStorage.getItem('stacks_played_before')
    if (name) setPlayerName(name)
    else setShowNameModal(true)
    if (best) setBestBalance(Number(best))
    if (bestP) setBestPicks(Number(bestP))
    if (games) setGamesPlayed(Number(games))
    if (played) setHasPlayedBefore(true)
    return () => clearAllTimers()
  }, [])

  useEffect(() => {
    if (playerName && gameState === 'idle') newRound(1, 0)
  }, [playerName])

  const newRound = (currentBalance: number, currentPicks: number) => {
    clearAllTimers()
    setRevealedTiles(Array(5).fill(false))
    setSelectedTile(null)
    setPulseActive(false)
    setLosingTile(Math.floor(Math.random() * 5))
    setBalance(currentBalance)
    setPicks(currentPicks)
    setGameState('playing')
  }

  const saveName = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setPlayerName(trimmed)
    localStorage.setItem('stacks_name', trimmed)
    setShowNameModal(false)
  }

  const startNewGame = () => {
    setShowShareButton(false)
    clearAllTimers()
    setRevealedTiles(Array(5).fill(false))
    setSelectedTile(null)
    setPulseActive(false)
    setLosingTile(Math.floor(Math.random() * 5))
    setBalance(1)
    setPicks(0)
    setGameState('playing')
    triggerShimmer()
  }

  const triggerShimmer = () => {
    setShimmerKey(k => k + 1)
  }

  const pickTile = (index: number) => {
    if (gameState !== 'playing') return
    playTileTap()
    setHasPickedThisSession(true)
    clearAllTimers()
    setSelectedTile(index)
    setGameState('pulsing')

    let pulseCount = 0
    const doPulse = () => {
      setPulseActive(true)
      playPulseBeat(pulseCount)
      addTimer(() => {
        setPulseActive(false)
        pulseCount++
        if (pulseCount < 2) {
          addTimer(doPulse, 150)
        } else {
          addTimer(() => runReveal(index, losingTile), 200)
        }
      }, 300)
    }
    doPulse()
  }

  const runReveal = (chosenIndex: number, currentLosingTile: number) => {
    setGameState('revealing')
    setRevealedTiles(Array(5).fill(false))

    const isLose = chosenIndex === currentLosingTile
    const revealOrder = chosenIndex <= 2 ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4]
    const SPEED = 360
    const totalRevealTime = 4 * SPEED

    revealOrder.forEach((ti, step) => {
      addTimer(() => {
        setRevealedTiles(prev => {
          const next = [...prev] as (false | 'win' | 'lose')[]
          next[ti] = ti === currentLosingTile ? 'lose' : 'win'
          return next
        })
        if (ti === currentLosingTile) {
          playTileRevealLose()
        } else {
          playTileRevealWin(ti)
        }
      }, step * SPEED)
    })

    addTimer(() => {
      if (isLose) {
        setGamesPlayed(prev => {
          const newGames = prev + 1
          localStorage.setItem('stacks_games', String(newGames))
          return newGames
        })
        localStorage.setItem('stacks_played_before', 'true')
        setHasPlayedBefore(true)
        playRunOver()

        setBalance(prev => {
          setLastRunBalance(prev)
          if (prev > bestBalance) {
            setBestBalance(prev)
            setBestPicks(picks)
            localStorage.setItem('stacks_best', String(prev))
            localStorage.setItem('stacks_best_picks', String(picks))
          }
          // Show share button if run ended at $32 or above
          if (prev >= 32) setShowShareButton(true)
          return prev
        })
        setPicks(prev => {
          setLastRunPicks(prev)
          return prev
        })
        setGameState('dead')
      } else {
        setBalance(prev => prev * 2)
        playBalanceUpdate()
        setPicks(prev => {
          const newPicks = prev + 1
          addTimer(() => {
            setRevealedTiles(Array(5).fill(false))
            setSelectedTile(null)
            setPulseActive(false)
            setLosingTile(Math.floor(Math.random() * 5))
            setGameState('playing')
            triggerShimmer()
          }, 400)
          return newPicks
        })
      }
    }, totalRevealTime + SPEED)
  }

  const formatBalance = (n: number) => `$${n.toLocaleString()}`

  const shareText = `I just STACKED:\n${formatBalance(lastRunBalance)}\nNailed ${lastRunPicks} pick${lastRunPicks !== 1 ? 's' : ''} 💸\n\nwww.playstacks.vercel.app`

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text: shareText })
    } else {
      navigator.clipboard.writeText(shareText)
      alert('Copied to clipboard!')
    }
  }

  const activeGame = (['playing', 'pulsing', 'revealing'] as GameState[]).includes(gameState)

  return (
    <main className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">

      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
            <h2 className="text-2xl font-bold text-[#1A2B3C] mb-2">Welcome</h2>
            <p className="text-[#7F8C8D] text-sm mb-6">What should we call you on the leaderboard?</p>
            <input
              type="text"
              maxLength={20}
              placeholder="Your name"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              className="w-full border border-[#CBD2D9] rounded-xl px-4 py-3 text-[#1A2B3C] text-base outline-none focus:border-[#1A3A5A] mb-4"
            />
            <button
              onClick={saveName}
              className="w-full bg-[#1A3A5A] text-white rounded-xl py-3 font-semibold text-base"
            >
              Let&apos;s go
            </button>
          </div>
        </div>
      )}

      {/* Run Over Overlay */}
      {gameState === 'dead' && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-40 p-6"
          onClick={() => setGameState('waiting')}
        >
          <div className="text-center">
            <p className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-4">Run over</p>
            <p className={`text-white font-bold tabular-nums ${
              formatBalance(balance).length > 12 ? 'text-3xl' :
              formatBalance(balance).length > 11 ? 'text-4xl' :
              'text-8xl'
            }`}>{formatBalance(balance)}</p>
            <p className="text-white/50 text-sm mt-3">{picks} pick{picks !== 1 ? 's' : ''}</p>
            <p className="text-white/30 text-xs mt-8">tap anywhere to continue</p>
          </div>
        </div>
      )}

      {/* Game Card */}
      <div className="bg-white rounded-3xl shadow-sm w-full max-w-sm p-8 flex flex-col items-center gap-6">

        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1A2B3C] tracking-tight">STACKS</h1>
          <p className="text-[#7F8C8D] text-sm mt-1">How much bank can you make?</p>
        </div>

        <div className="text-center">
          <p className={`font-bold text-[#1A2B3C] tabular-nums ${
            formatBalance(balance).length > 12 ? 'text-3xl' :
            formatBalance(balance).length > 11 ? 'text-4xl' :
            'text-6xl'
          }`}>{formatBalance(balance)}</p>
          {activeGame && (
            <p className="text-[#7F8C8D] text-sm mt-2">Pick #{picks + 1}</p>
          )}
        </div>

        {/* Tiles */}
        <div className="flex gap-2 w-full">
          {Array(5).fill(null).map((_, i) => {
            const state = revealedTiles[i]
            const isSelected = selectedTile === i
            const isPulseOn = gameState === 'pulsing' && isSelected && pulseActive
            const isPulseOff = gameState === 'pulsing' && isSelected && !pulseActive

            let bg = 'bg-[#CBD2D9]'
            if (state === 'win') bg = 'bg-[#2ECC71]'
            else if (state === 'lose') bg = 'bg-[#E74C3C]'
            else if (isPulseOn) bg = 'bg-[#1A3A5A]'
            else if (isPulseOff) bg = 'bg-[#6A9ABB]'

            const ring = (isPulseOn || isPulseOff) ? 'ring-4 ring-[#1A3A5A] ring-offset-1' : ''
            const cursor = gameState === 'playing' ? 'cursor-pointer hover:bg-[#B0BEC5] active:scale-95' : ''

            return (
              <button
                key={`${shimmerKey}-${i}`}
                onClick={() => pickTile(i)}
                disabled={gameState !== 'playing'}
                style={{ animationDelay: `${i * 80}ms` }}
                className={`flex-1 h-16 rounded-xl transition-all duration-150 ${bg} ${ring} ${cursor} ${gameState === 'playing' ? 'animate-shimmer-tile' : ''}`}
              />
            )
          })}
        </div>

        {/* Instructions */}
        {!hasPickedThisSession && gameState === 'playing' && (
          <div className="text-center text-sm text-[#7F8C8D] leading-relaxed space-y-1">
            <p>Choose a tile.</p>
            <p>4 are <span className="text-[#2ECC71] font-semibold">green</span>. 1 is <span className="text-[#E74C3C] font-semibold">red</span>.</p>
            <p><span className="text-[#2ECC71] font-semibold">Green</span> = double your money.</p>
            <p><span className="text-[#E74C3C] font-semibold">Red</span> = game over.</p>
          </div>
        )}

        {/* Play Again */}
        {gameState === 'waiting' && (
          <button
            onClick={startNewGame}
            className="w-full bg-[#2ECC71] text-white rounded-xl py-4 font-semibold text-base"
          >
            Play Again
          </button>
        )}

        {/* Share */}
        {gameState === 'waiting' && showShareButton && (
          <button
            onClick={handleShare}
            className="w-full bg-[#F5C518] text-[#1A2B3C] rounded-xl py-4 font-semibold text-base active:scale-95 active:bg-[#D4A800] transition-all duration-100"
          >
            Share Result
          </button>
        )}

        {/* Stats */}
        <div className="w-full border-t border-[#F4F6F8] pt-4 text-center space-y-1">
          <p className="text-[#1A2B3C] font-semibold text-sm">{playerName}</p>
          <p className="text-[#7F8C8D] text-xs">
            Best: {formatBalance(bestBalance)} · {bestPicks} picks · {gamesPlayed} run{gamesPlayed !== 1 ? 's' : ''}
          </p>
        </div>

      </div>
    </main>
  )
}