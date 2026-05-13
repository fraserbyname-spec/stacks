'use client'

import { useState, useEffect, useRef } from 'react'
import { playTileRevealWin, playTileRevealLose, playBalanceUpdate, playRunOver, playTick } from './sounds'

type GameState = 'idle' | 'playing' | 'dead' | 'waiting'
type TileState = 'grey' | 'green' | 'red'

const STAGES = [
  { minPick: 0,  maxPick: 5,  green: 4, grey: 4, red: 1, startMs: 900, endMs: 840 },
  { minPick: 6,  maxPick: 10, green: 4, grey: 3, red: 2, startMs: 840, endMs: 780 },
  { minPick: 11, maxPick: 15, green: 3, grey: 3, red: 3, startMs: 780, endMs: 720 },
  { minPick: 16, maxPick: 20, green: 3, grey: 2, red: 4, startMs: 720, endMs: 660 },
  { minPick: 21, maxPick: 25, green: 2, grey: 3, red: 4, startMs: 660, endMs: 600 },
  { minPick: 26, maxPick: 30, green: 2, grey: 2, red: 5, startMs: 600, endMs: 540 },
  { minPick: 31, maxPick: 35, green: 1, grey: 3, red: 5, startMs: 540, endMs: 480 },
  { minPick: 36, maxPick: Infinity, green: 1, grey: 2, red: 6, startMs: 480, endMs: 400 },
]

const getStage = (pick: number) =>
  STAGES.find(s => pick >= s.minPick && pick <= s.maxPick) ?? STAGES[STAGES.length - 1]

const getDwell = (pick: number): number => {
  const stage = getStage(pick)
  const progress = (pick - stage.minPick) / Math.max(1, stage.maxPick - stage.minPick)
  return Math.round(stage.startMs - (stage.startMs - stage.endMs) * Math.min(progress, 1))
}

const generateTiles = (pick: number, prevTiles: TileState[]): TileState[] => {
  const stage = getStage(pick)
  const total = 9
  const colours: TileState[] = [
    ...Array(stage.green).fill('green'),
    ...Array(stage.grey).fill('grey'),
    ...Array(stage.red).fill('red'),
  ]

  // Shuffle
  for (let i = colours.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colours[i], colours[j]] = [colours[j], colours[i]]
  }

  // Ensure every tile moves to a new position
  let attempts = 0
  while (attempts < 20) {
    let allMoved = true
    for (let i = 0; i < total; i++) {
      if (colours[i] === prevTiles[i]) { allMoved = false; break }
    }
    if (allMoved) break
    // Re-shuffle
    for (let i = colours.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colours[i], colours[j]] = [colours[j], colours[i]]
    }
    attempts++
  }

  return colours
}

export default function Home() {
  const [balance, setBalance] = useState(1)
  const [taps, setTaps] = useState(0)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [tiles, setTiles] = useState<TileState[]>(Array(9).fill('grey'))
  const [playerName, setPlayerName] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [showNameModal, setShowNameModal] = useState(false)
  const [bestBalance, setBestBalance] = useState(1)
  const [bestTaps, setBestTaps] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [hasPlayedBefore, setHasPlayedBefore] = useState(false)
  const [hasStartedSession, setHasStartedSession] = useState(false)
  const [showShareButton, setShowShareButton] = useState(false)
  const [lastRunBalance, setLastRunBalance] = useState(0)
  const [lastRunTaps, setLastRunTaps] = useState(0)
  const [balancePulse, setBalancePulse] = useState(0)
  const [lastRunType, setLastRunType] = useState<'busted-with-option' | 'busted-no-option'>('busted-no-option')
  const [playerId, setPlayerId] = useState<string>('')
  const [todayBest, setTodayBest] = useState(0)
  const [todayTaps, setTodayTaps] = useState(0)
  const [todayRuns, setTodayRuns] = useState(0)
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapsRef = useRef(0)
  const gameStateRef = useRef<GameState>('idle')
  const tilesRef = useRef<TileState[]>(Array(9).fill('grey'))
  const tappedThisCycle = useRef(false)

  const clearCycle = () => {
    if (cycleRef.current) { clearTimeout(cycleRef.current); cycleRef.current = null }
  }

  useEffect(() => {
    const name = localStorage.getItem('stacks_name_v2')
    const best = localStorage.getItem('stacks_best_v2')
    const bestP = localStorage.getItem('stacks_best_picks_v2')
    const games = localStorage.getItem('stacks_games_v2')
    const played = localStorage.getItem('stacks_played_before_v2')
    const todayKey = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
    const todayBestVal = localStorage.getItem(`stacks_today_best_${todayKey}`)
    const todayPicksVal = localStorage.getItem(`stacks_today_picks_${todayKey}`)
    const todayRunsVal = localStorage.getItem(`stacks_today_runs_${todayKey}`)
    if (todayBestVal) setTodayBest(Number(todayBestVal))
    if (todayPicksVal) setTodayTaps(Number(todayPicksVal))
    if (todayRunsVal) setTodayRuns(Number(todayRunsVal))
    let pid = localStorage.getItem('stacks_player_id_v2')
    if (!pid) {
      pid = Math.random().toString(36).slice(2)
      localStorage.setItem('stacks_player_id_v2', pid)
    }
    setPlayerId(pid)
    if (name) setPlayerName(name)
    else setShowNameModal(true)
    if (best) setBestBalance(Number(best))
    if (bestP) setBestTaps(Number(bestP))
    if (games) setGamesPlayed(Number(games))
    if (played) setHasPlayedBefore(true)
    if (!todayBestVal && pid) {
      fetch(`/api/leaderboard/daily?player_id=${pid}`)
        .then(r => r.json())
        .then(data => {
          const top10 = data.top10 || []
          const playerInTop10 = top10.find((s: any) => s.player_id === pid)
          const playerScore = playerInTop10 || data.playerRank
          if (playerScore?.balance) {
            setTodayBest(playerScore.balance)
            setTodayTaps(playerScore.picks)
            const key = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
            localStorage.setItem(`stacks_today_best_${key}`, String(playerScore.balance))
            localStorage.setItem(`stacks_today_picks_${key}`, String(playerScore.picks))
          }
        })
        .catch(() => {})
    }
    return () => clearCycle()
  }, [])

  useEffect(() => {
    if (playerName && playerId && gameState === 'idle') startRound(1, 0)
  }, [playerName, playerId])

  useEffect(() => { tapsRef.current = taps }, [taps])
  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  const startCycle = (currentTaps: number, prevTiles: TileState[]) => {
    clearCycle()
    if (gameStateRef.current !== 'playing') return
    const newTiles = generateTiles(currentTaps, prevTiles)
    setTiles(newTiles)
    tilesRef.current = newTiles
    tappedThisCycle.current = false
    playTick()
    const dwell = getDwell(currentTaps)
    cycleRef.current = setTimeout(() => {
      if (gameStateRef.current === 'playing') {
        startCycle(tapsRef.current, tilesRef.current)
      }
    }, dwell)
  }

  const startRound = (currentBalance: number, currentTaps: number) => {
    clearCycle()
    setBalance(currentBalance)
    setTaps(currentTaps)
    tapsRef.current = currentTaps
    setTiles(Array(9).fill('grey'))
    tilesRef.current = Array(9).fill('grey')
    tappedThisCycle.current = false
    setGameState('playing')
    gameStateRef.current = 'playing'
    setTimeout(() => startCycle(currentTaps, Array(9).fill('grey')), 100)
  }

  const saveName = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setPlayerName(trimmed)
    localStorage.setItem('stacks_name_v2', trimmed)
    setShowNameModal(false)
  }

  const startNewGame = () => {
    setShowShareButton(false)
    setHasStartedSession(true)
    startRound(1, 0)
  }

  const submitScore = (bal: number, t: number) => {
    const todayKey = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
    if (bal >= 32) {
      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: playerName, balance: bal, picks: t, player_id: playerId })
      })
      if (bal > todayBest) {
        setTodayBest(bal)
        setTodayTaps(t)
        localStorage.setItem(`stacks_today_best_${todayKey}`, String(bal))
        localStorage.setItem(`stacks_today_picks_${todayKey}`, String(t))
      }
    }
    const newGames = gamesPlayed + 1
    setGamesPlayed(newGames)
    localStorage.setItem('stacks_games_v2', String(newGames))
    const newTodayRuns = todayRuns + 1
    setTodayRuns(newTodayRuns)
    localStorage.setItem(`stacks_today_runs_${todayKey}`, String(newTodayRuns))
    localStorage.setItem('stacks_played_before_v2', 'true')
    setHasPlayedBefore(true)
  }

  const tapTile = (index: number, tileState: TileState) => {
    if (gameState !== 'playing') return
    if (tileState === 'grey') return
    if (tappedThisCycle.current) return // one tap per cycle
    tappedThisCycle.current = true
    setHasStartedSession(true)

    if (tileState === 'green') {
      playTileRevealWin(index)
      clearCycle()
      const newBalance = balance * 2
      const newTaps = taps + 1
      setBalance(newBalance)
      setBalancePulse(k => k + 1)
      playBalanceUpdate()
      setTaps(newTaps)
      tapsRef.current = newTaps
      if (newBalance > bestBalance) {
        setBestBalance(newBalance)
        setBestTaps(newTaps)
        localStorage.setItem('stacks_best_v2', String(newBalance))
        localStorage.setItem('stacks_best_picks_v2', String(newTaps))
      }
      setTimeout(() => {
        if (gameStateRef.current === 'playing') {
          startCycle(newTaps, tilesRef.current)
        }
      }, 300)

    } else if (tileState === 'red') {
      clearCycle()
      gameStateRef.current = 'dead'
      playTileRevealLose()
      setTimeout(() => playRunOver(), 100)
      submitScore(balance, taps)
      setLastRunBalance(balance)
      setLastRunTaps(taps)
      if (balance >= 32) setShowShareButton(true)
      setLastRunType('busted-no-option')
      setGameState('dead')
    }
  }

  const formatBalance = (n: number) => {
    if (n >= 1000000000000000) {
      const q = n / 1000000000000000
      return `$${q % 1 === 0 ? q.toFixed(0) : q.toFixed(1)}Q`
    }
    if (n >= 1000000000000) {
      const t = n / 1000000000000
      return `$${t % 1 === 0 ? t.toFixed(0) : t.toFixed(1)}T`
    }
    if (n >= 1000000000) {
      const b = n / 1000000000
      return `$${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)}B`
    }
    if (n >= 1000000) {
      const m = n / 1000000
      return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
    }
    return `$${n.toLocaleString()}`
  }

  const shareText = lastRunType === 'busted-with-option'
    ? `I just busted on:\n${formatBalance(lastRunBalance)}\nShould have stopped 🤦\n\nhttps://stacksgame.app`
    : `I made it to:\n${formatBalance(lastRunBalance)}\n${lastRunTaps} taps 💸\n\nhttps://stacksgame.app`

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text: shareText })
    } else {
      navigator.clipboard.writeText(shareText)
      alert('Copied to clipboard!')
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-start pt-6 px-4 pb-16">

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

      {/* Run Over Overlay */}
      {gameState === 'dead' && (
        <div
          className="fixed inset-0 flex items-center justify-center z-40 p-6"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setGameState('waiting')}
        >
          <div className="text-center">
            <p className="text-white/70 text-4xl font-bold tracking-widest uppercase mb-4">
              Run over
            </p>
            <p className={`text-white font-bold tabular-nums ${
              formatBalance(balance).length > 12 ? 'text-2xl' :
              formatBalance(balance).length > 11 ? 'text-3xl' :
              'text-5xl'
            }`}>{formatBalance(balance)}</p>
            <p className="text-white/50 text-xl mt-4">{taps} tap{taps !== 1 ? 's' : ''}</p>
            <p className="text-white/30 text-base mt-8">tap anywhere to continue</p>
          </div>
        </div>
      )}

      {/* Game Card */}
      <div className="bg-white rounded-3xl shadow-sm w-full max-w-sm p-8 flex flex-col items-center gap-6">

        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1A2B3C] tracking-tight">STACKS</h1>
          <p className="text-[#7F8C8D] text-lg mt-1">
            {hasStartedSession ? 'Tap green to grow it.' : 'How much bank can you make?'}
          </p>
        </div>

        <div className="text-center">
          <p
            key={balancePulse}
            className={`font-bold text-[#1A2B3C] tabular-nums ${
              formatBalance(balance).length > 12 ? 'text-3xl' :
              formatBalance(balance).length > 11 ? 'text-4xl' :
              'text-6xl'
            } ${balancePulse > 0 ? 'animate-balance-pulse' : ''}`}
          >{formatBalance(balance)}</p>
          {gameState === 'playing' && (
            <p className="text-[#7F8C8D] text-sm mt-2">Tap #{taps + 1}</p>
          )}
        </div>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {tiles.map((tileState, i) => {
            let bg = 'bg-[#B0BEC5] shadow-inner'
            if (tileState === 'green') bg = 'bg-[#2ECC71] shadow-md'
            else if (tileState === 'red') bg = 'bg-[#E74C3C] shadow-md'
            const cursor = gameState === 'playing' ? 'cursor-pointer active:scale-95' : ''
            return (
              <button
                key={i}
                onClick={() => tapTile(i, tileState)}
                disabled={gameState !== 'playing'}
                className={`h-20 rounded-xl transition-all duration-100 ${bg} ${cursor}`}
              />
            )
          })}
        </div>

        {/* Instructions */}
        {!hasStartedSession && gameState === 'playing' && (
          <div className="text-center text-base text-[#7F8C8D] leading-relaxed space-y-1">
            <p className="font-bold text-[#1A2B3C] text-lg">How to grow your Stack.</p>
            <p>Tap a <span className="text-[#27AE60] font-semibold">green</span> tile = double your money.</p>
            <p>Tap a <span className="text-[#E74C3C] font-semibold">red</span> tile = game over.</p>
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
          <p className="text-[#1A2B3C] font-semibold text-base">{playerName}</p>
          <p className="text-[#7F8C8D] text-sm">
            Best: {formatBalance(bestBalance)} <span className="text-[#7F8C8D]">·</span> {bestTaps} taps <span className="text-[#7F8C8D]">·</span> {gamesPlayed} run{gamesPlayed !== 1 ? 's' : ''}
          </p>
          <p className="text-[#7F8C8D] text-sm">
            Best Today: {formatBalance(todayBest)} <span className="text-[#7F8C8D]">·</span> {todayTaps} taps <span className="text-[#7F8C8D]">·</span> {todayRuns} run{todayRuns !== 1 ? 's' : ''} today
          </p>
          <div className="flex justify-center gap-3">
            <a href="/leaderboard" className="text-[#3d5a80] text-sm font-semibold underline">World&apos;s Biggest Stackers</a>
            <span className="text-[#7F8C8D] text-base font-bold">·</span>
            <a href="/leaderboard/daily" className="text-[#3d5a80] text-sm font-semibold underline">Today&apos;s Stackers</a>
          </div>
        </div>

      </div>

      {/* Ad unit placeholder */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-[#E0E0E0] flex items-center justify-center">
        <p className="text-[#CBD2D9] text-xs">Advertisement</p>
      </div>
    </main>
  )
}