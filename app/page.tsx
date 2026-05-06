'use client'

import { useState, useEffect, useRef } from 'react'
import { playTileTap, playPulseBeat, playTileRevealWin, playTileRevealLose, playBalanceUpdate, playRunOver } from './sounds'

type GameState = 'idle' | 'playing' | 'pulsing' | 'revealing' | 'dead' | 'waiting'

export default function Home() {
  const [balance, setBalance] = useState(1)
  const [picks, setPicks] = useState(0)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
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
  const [canBank, setCanBank] = useState(false)
  const [hadBankOption, setHadBankOption] = useState(false)
  const [showBankSuccess, setShowBankSuccess] = useState(false)
  const [bankSuccessMessage, setBankSuccessMessage] = useState('')
  const [playerId, setPlayerId] = useState<string>('')
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
    let pid = localStorage.getItem('stacks_player_id')
    if (!pid) {
      pid = Math.random().toString(36).slice(2)
      localStorage.setItem('stacks_player_id', pid)
    }
    setPlayerId(pid)
    if (name) setPlayerName(name)
    else setShowNameModal(true)
    if (best) setBestBalance(Number(best))
    if (bestP) setBestPicks(Number(bestP))
    if (games) setGamesPlayed(Number(games))
    if (played) setHasPlayedBefore(true)
    return () => clearAllTimers()
  }, [])

  useEffect(() => {
    if (playerName && playerId && gameState === 'idle') newRound(1, 0, playerId)
  }, [playerName, playerId])

  const getSession = async (pid: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: pid })
      })
      const data = await res.json()
      return data.sessionId || null
    } catch {
      return null
    }
  }

  const newRound = async (currentBalance: number, currentPicks: number, pid?: string) => {
    clearAllTimers()
    setRevealedTiles(Array(5).fill(false))
    setSelectedTile(null)
    setPulseActive(false)
    setCanBank(false)
    setHadBankOption(false)
    setBalance(currentBalance)
    setPicks(currentPicks)
    setGameState('playing')
    const sid = await getSession(pid || playerId)
    setSessionId(sid)
    triggerShimmer()
  }

  const saveName = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setPlayerName(trimmed)
    localStorage.setItem('stacks_name', trimmed)
    setShowNameModal(false)
  }

  const startNewGame = async () => {
    setShowShareButton(false)
    setCanBank(false)
    setHadBankOption(false)
    setShowBankSuccess(false)
    clearAllTimers()
    setRevealedTiles(Array(5).fill(false))
    setSelectedTile(null)
    setPulseActive(false)
    setBalance(1)
    setPicks(0)
    setGameState('playing')
    const sid = await getSession(playerId)
    setSessionId(sid)
    triggerShimmer()
  }

  const handleBank = () => {
    clearAllTimers()
    const isNewBest = balance > bestBalance
    if (isNewBest) {
      setBestBalance(balance)
      setBestPicks(picks)
      localStorage.setItem('stacks_best', String(balance))
      localStorage.setItem('stacks_best_picks', String(picks))
    }
    fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_name: playerName,
        balance,
        picks,
        player_id: playerId
      })
    })
    const newGames = gamesPlayed + 1
    setGamesPlayed(newGames)
    localStorage.setItem('stacks_games', String(newGames))
    localStorage.setItem('stacks_played_before', 'true')
    setHasPlayedBefore(true)
    setLastRunBalance(balance)
    setLastRunPicks(picks)
    setCanBank(false)
    if (balance >= 32) {
      setBankSuccessMessage(isNewBest ? 'Your new personal best!' : 'Added to the leaderboard!')
    } else {
      setBankSuccessMessage('Stack banked!')
    }
    setShowBankSuccess(true)
  }

  const triggerShimmer = () => {
    setShimmerKey(k => k + 1)
  }

  const pickTile = async (index: number) => {
    if (gameState !== 'playing' || !sessionId) return
    const capturedSessionId = sessionId
    const capturedPlayerId = playerId
    playTileTap()
    setHasPickedThisSession(true)
    clearAllTimers()
    setSelectedTile(index)
    setGameState('pulsing')

    // Fire server call immediately during pulse so response is ready when pulse ends
    const serverPromise = fetch('/api/game/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: capturedSessionId,
        chosen_tile: index,
        player_id: capturedPlayerId
      })
    }).then(r => r.json()).catch(() => null)

    let pulseCount = 0
    const doPulse = () => {
      setPulseActive(true)
      playPulseBeat(pulseCount)
      addTimer(() => {
        setPulseActive(false)
        pulseCount++
        if (pulseCount < 1) {
          addTimer(doPulse, 150)
        } else {
          revealFromServer(index, capturedSessionId, capturedPlayerId, serverPromise)
        }
      }, 300)
    }
    doPulse()
  }

  const revealFromServer = async (chosenIndex: number, lockedSessionId: string, lockedPlayerId: string, prefiredPromise?: Promise<any>) => {
    setGameState('revealing')
    setRevealedTiles(Array(5).fill(false))

    const revealOrder = chosenIndex <= 2 ? [4, 3, 2, 1, 0] : [0, 1, 2, 3, 4]
    const SPEED = 200
    const totalRevealTime = 4 * SPEED

    // Use pre-fired promise from pickTile if available
    let isLose = false
    let losingTile = -1
    try {
      const data = prefiredPromise ? await prefiredPromise : await fetch('/api/game/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: lockedSessionId,
          chosen_tile: chosenIndex,
          player_id: lockedPlayerId
        })
      }).then(r => r.json())
      if (typeof data.isLose === 'boolean' && typeof data.losingTile === 'number') {
        isLose = data.isLose
        losingTile = data.losingTile
      } else {
        // Valid response but missing expected fields — don't punish player
        isLose = false
        losingTile = Math.floor(Math.random() * 5)
        while (losingTile === chosenIndex) {
          losingTile = Math.floor(Math.random() * 5)
        }
      }
    } catch {
      // Network failure — don't punish player
      isLose = false
      losingTile = Math.floor(Math.random() * 5)
      while (losingTile === chosenIndex) {
        losingTile = Math.floor(Math.random() * 5)
      }
    }

    revealOrder.forEach((ti, step) => {
      addTimer(() => {
        setRevealedTiles(prev => {
          const next = [...prev] as (false | 'win' | 'lose')[]
          next[ti] = ti === losingTile ? 'lose' : 'win'
          return next
        })
        if (ti === losingTile) {
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
          if (prev >= 32) setShowShareButton(true)
          return prev
        })
        setPicks(prev => {
          setLastRunPicks(prev)
          return prev
        })
        setGameState('dead')
      } else {
        setBalance(prev => {
          const newBalance = prev * 2
          if (newBalance > bestBalance) {
            setCanBank(true)
            setHadBankOption(true)
          }
          return newBalance
        })
        playBalanceUpdate()
        setPicks(prev => prev + 1)
        // Get new session for next round
        addTimer(async () => {
            setRevealedTiles(Array(5).fill(false))
            setSelectedTile(null)
            setPulseActive(false)
            setGameState('playing')
            triggerShimmer()
            // Get session in background — don't block the UI
            getSession(playerId).then(sid => setSessionId(sid))
          }, 300)
      }
    }, totalRevealTime + SPEED)
  }

  const formatBalance = (n: number) => `$${n.toLocaleString()}`

  const shareText = `I just STACKED:\n${formatBalance(lastRunBalance)}\nNailed ${lastRunPicks} pick${lastRunPicks !== 1 ? 's' : ''} 💸\n\nhttps://stacksgame.app`

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
              maxLength={12}
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

      {/* Bank Success Overlay */}
      {showBankSuccess && (
        <div
          className="fixed inset-0 flex items-center justify-center z-40 p-6"
          style={{ backgroundColor: 'rgba(20, 80, 40, 0.88)' }}
          onClick={() => {
            setShowBankSuccess(false)
            setShowShareButton(true)
            setGameState('waiting')
          }}
        >
          <div className="text-center">
            <p className="text-white text-6xl font-bold mb-4">Stacked! 🏦</p>
            <p className={`text-white font-bold tabular-nums mb-4 ${
              formatBalance(balance).length > 12 ? 'text-2xl' :
              formatBalance(balance).length > 11 ? 'text-3xl' :
              'text-5xl'
            }`}>{formatBalance(balance)}</p>
            <p className="text-white/70 text-xl mt-2">{bankSuccessMessage}</p>
            <p className="text-white/30 text-base mt-8">tap anywhere to continue</p>
          </div>
        </div>
      )}

      {/* Run Over Overlay */}
      {gameState === 'dead' && (
        <div
          className="fixed inset-0 flex items-center justify-center z-40 p-6"
          style={{ backgroundColor: hadBankOption ? 'rgba(120, 20, 20, 0.82)' : 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setGameState('waiting')}
        >
          <div className="text-center">
            <p className="text-white/70 text-4xl font-bold tracking-widest uppercase mb-4">
              {hadBankOption ? 'Bust!' : 'Run over'}
            </p>
            <p className={`text-white font-bold tabular-nums ${
              formatBalance(balance).length > 12 ? 'text-2xl' :
              formatBalance(balance).length > 11 ? 'text-3xl' :
              'text-5xl'
            }`}>{formatBalance(balance)}</p>
            <p className="text-white/50 text-xl mt-4">{picks} pick{picks !== 1 ? 's' : ''}</p>
            {hadBankOption && (
              <p className="text-white/60 text-xl mt-2">Should have banked that stack.</p>
            )}
            <p className="text-white/30 text-base mt-8">tap anywhere to continue</p>
          </div>
        </div>
      )}

      {/* Game Card */}
      <div className="bg-white rounded-3xl shadow-sm w-full max-w-sm p-8 flex flex-col items-center gap-6">

        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1A2B3C] tracking-tight">STACKS</h1>
          <p className="text-[#7F8C8D] text-lg mt-1">How much bank can you make?</p>
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

        {/* Bank My Stack */}
        {canBank && gameState === 'playing' && (
          <button
            onClick={handleBank}
            className="w-full bg-white text-[#1A2B3C] rounded-xl py-4 font-semibold text-base border-2 border-[#1A2B3C] shadow-md active:scale-95 active:shadow-sm transition-all duration-100"
          >
            Bank My Stack &nbsp; 🏦
          </button>
        )}

        {/* Instructions */}
        {!hasPickedThisSession && gameState === 'playing' && (
          <div className="text-center text-base text-[#7F8C8D] leading-relaxed space-y-1">
            <p className="font-bold text-[#1A2B3C] text-lg">Bank your Stack before you bust!</p>
            <p>Choose a tile.</p>
            <p>4 are <span className="text-[#27AE60] font-semibold">green</span>. 1 is <span className="text-[#E74C3C] font-semibold">red</span>.</p>
            <p><span className="text-[#27AE60] font-semibold">Green</span> = double your money.</p>
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
          <a href="/leaderboard" className="text-[#3d5a80] text-sm font-semibold underline">leaderboard</a>
        </div>

      </div>
    </main>
  )
}