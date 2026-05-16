'use client'

import { useState, useEffect, useRef } from 'react'
import { playTileRevealWin, playTileRevealLose, playBalanceUpdate, playRunOver, playTick } from '../sounds'

type GameState = 'idle' | 'ready' | 'playing' | 'dead' | 'waiting'
type TileState = 'grey' | 'green' | 'red'

const STAGES = [
  { minPick: 0,  maxPick: 5,  green: 4, grey: 4, red: 1, startMs: 900, endMs: 780, noGreenChance: 0 },
  { minPick: 6,  maxPick: 10, green: 4, grey: 3, red: 2, startMs: 780, endMs: 720, noGreenChance: 0 },
  { minPick: 11, maxPick: 15, green: 3, grey: 3, red: 3, startMs: 720, endMs: 660, noGreenChance: 0 },
  { minPick: 16, maxPick: 20, green: 3, grey: 2, red: 4, startMs: 660, endMs: 600, noGreenChance: 0 },
  { minPick: 21, maxPick: 25, green: 2, grey: 3, red: 4, startMs: 600, endMs: 540, noGreenChance: 0.15 },
  { minPick: 26, maxPick: 30, green: 2, grey: 2, red: 5, startMs: 540, endMs: 480, noGreenChance: 0.15 },
  { minPick: 31, maxPick: 35, green: 1, grey: 3, red: 5, startMs: 480, endMs: 450, noGreenChance: 0.15 },
  { minPick: 36, maxPick: Infinity, green: 1, grey: 2, red: 6, startMs: 450, endMs: 400, noGreenChance: 0.15 },
]

const getStage = (pick: number) =>
  STAGES.find(s => pick >= s.minPick && pick <= s.maxPick) ?? STAGES[STAGES.length - 1]

const getDwell = (pick: number): number => {
  const stage = getStage(pick)
  const stageLength = stage.maxPick === Infinity ? 5 : stage.maxPick - stage.minPick
  const progress = Math.min((pick - stage.minPick) / Math.max(1, stageLength), 1)
  return Math.round(stage.startMs - (stage.startMs - stage.endMs) * progress)
}

const generateTiles = (pick: number, prevTiles: TileState[], noGreenThisCycle: boolean): TileState[] => {
  const stage = getStage(pick)
  let colours: TileState[]
  if (noGreenThisCycle) {
    colours = [...Array(stage.green + stage.grey).fill('grey'), ...Array(stage.red).fill('red')]
  } else {
    colours = [...Array(stage.green).fill('green'), ...Array(stage.grey).fill('grey'), ...Array(stage.red).fill('red')]
  }
  for (let i = colours.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colours[i], colours[j]] = [colours[j], colours[i]]
  }
  let attempts = 0
  while (attempts < 20) {
    let allMoved = true
    for (let i = 0; i < 9; i++) {
      if (colours[i] === prevTiles[i]) { allMoved = false; break }
    }
    if (allMoved) break
    for (let i = colours.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colours[i], colours[j]] = [colours[j], colours[i]]
    }
    attempts++
  }
  return colours
}

export default function PlayGame() {
  const [balance, setBalance] = useState(1)
  const [taps, setTaps] = useState(0)
  const [gameState, setGameState] = useState<GameState>('ready')
  const getPreviewTiles = (): TileState[] => {
    const t: TileState[] = Array(9).fill('grey')
    t[Math.floor(Math.random() * 9)] = 'green'
    let redPos = Math.floor(Math.random() * 9)
    while (t[redPos] !== 'grey') redPos = Math.floor(Math.random() * 9)
    t[redPos] = 'red'
    return t
  }
  const [tiles, setTiles] = useState<TileState[]>(getPreviewTiles())
  const [playerName, setPlayerName] = useState('')
  const [bestBalance, setBestBalance] = useState(1)
  const [bestTaps, setBestTaps] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [showShareButton, setShowShareButton] = useState(false)
  const [lastRunBalance, setLastRunBalance] = useState(0)
  const [lastRunTaps, setLastRunTaps] = useState(0)
  const [balancePulse, setBalancePulse] = useState(0)
  const [playerId, setPlayerId] = useState<string>('')
  const [todayBest, setTodayBest] = useState(0)
  const [todayTaps, setTodayTaps] = useState(0)
  const [todayRuns, setTodayRuns] = useState(0)
  const [selectionTimer, setSelectionTimer] = useState(5)
  const [timedOut, setTimedOut] = useState(false)
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapsRef = useRef(0)
  const gameStateRef = useRef<GameState>('ready')
  const tilesRef = useRef<TileState[]>(Array(9).fill('grey'))
  const tappedThisCycle = useRef(false)
  const cycleCountRef = useRef(0)
  const noGreenUsedInGroupRef = useRef(false)

  const clearCycle = () => {
    if (cycleRef.current) { clearTimeout(cycleRef.current); cycleRef.current = null }
  }

  useEffect(() => {
    const name = localStorage.getItem('stacks_name_v2')
    const best = localStorage.getItem('stacks_play_best')
    const bestT = localStorage.getItem('stacks_play_best_taps')
    const games = localStorage.getItem('stacks_play_games')
    const todayKey = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
    const todayBestVal = localStorage.getItem(`stacks_play_today_best_${todayKey}`)
    const todayTapsVal = localStorage.getItem(`stacks_play_today_taps_${todayKey}`)
    const todayRunsVal = localStorage.getItem(`stacks_play_today_runs_${todayKey}`)
    if (todayBestVal) setTodayBest(Number(todayBestVal))
    if (todayTapsVal) setTodayTaps(Number(todayTapsVal))
    if (todayRunsVal) setTodayRuns(Number(todayRunsVal))
    let pid = localStorage.getItem('stacks_player_id_v2')
    if (!pid) { pid = Math.random().toString(36).slice(2); localStorage.setItem('stacks_player_id_v2', pid) }
    setPlayerId(pid)
    if (name) setPlayerName(name)
    if (best) setBestBalance(Number(best))
    if (bestT) setBestTaps(Number(bestT))
    if (games) setGamesPlayed(Number(games))
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
            localStorage.setItem(`stacks_play_today_best_${key}`, String(playerScore.balance))
            localStorage.setItem(`stacks_play_today_taps_${key}`, String(playerScore.picks))
          }
        })
        .catch(() => {})
    }
    return () => clearCycle()
  }, [])

  useEffect(() => { tapsRef.current = taps }, [taps])
  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  const startCycle = (currentTaps: number, prevTiles: TileState[]) => {
    clearCycle()
    if (gameStateRef.current !== 'playing') return
    const stage = getStage(currentTaps)
    let noGreenThisCycle = false
    if (stage.noGreenChance > 0 && !noGreenUsedInGroupRef.current) {
      if (Math.random() < stage.noGreenChance) {
        noGreenThisCycle = true
        noGreenUsedInGroupRef.current = true
      }
    }
    const newTiles = generateTiles(currentTaps, prevTiles, noGreenThisCycle)
    setTiles(newTiles)
    tilesRef.current = newTiles
    tappedThisCycle.current = false
    playTick()
    cycleCountRef.current += 1
    const remaining = 5 - (cycleCountRef.current - 1)
    setSelectionTimer(Math.max(1, remaining))
    if (cycleCountRef.current > 5) {
      gameStateRef.current = 'dead'
      playRunOver()
      const finalBalance = balance
      submitScore(finalBalance, tapsRef.current)
      setLastRunBalance(finalBalance)
      setLastRunTaps(tapsRef.current)
      if (balance >= 32) setShowShareButton(true)
      setTimedOut(true)
      setGameState('dead')
      return
    }
    const dwell = getDwell(currentTaps)
    cycleRef.current = setTimeout(() => {
      if (gameStateRef.current === 'playing') startCycle(tapsRef.current, tilesRef.current)
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
    cycleCountRef.current = 0
    noGreenUsedInGroupRef.current = false
    setSelectionTimer(5)
    setTimedOut(false)
    setGameState('playing')
    gameStateRef.current = 'playing'
    setTimeout(() => startCycle(currentTaps, Array(9).fill('grey')), 100)
  }

  const startNewGame = () => {
    setShowShareButton(false)
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
        localStorage.setItem(`stacks_play_today_best_${todayKey}`, String(bal))
        localStorage.setItem(`stacks_play_today_taps_${todayKey}`, String(t))
      }
    }
    if (bal > bestBalance) {
      setBestBalance(bal)
      setBestTaps(t)
      localStorage.setItem('stacks_play_best', String(bal))
      localStorage.setItem('stacks_play_best_taps', String(t))
    }
    const newGames = gamesPlayed + 1
    setGamesPlayed(newGames)
    localStorage.setItem('stacks_play_games', String(newGames))
    const newTodayRuns = todayRuns + 1
    setTodayRuns(newTodayRuns)
    localStorage.setItem(`stacks_play_today_runs_${todayKey}`, String(newTodayRuns))
    localStorage.setItem('stacks_played_before_v2', 'true')
  }

  const tapTile = (index: number, tileState: TileState) => {
    if (gameState !== 'playing') return
    if (tileState === 'grey') return
    if (tappedThisCycle.current) return
    tappedThisCycle.current = true

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
      cycleCountRef.current = 0
      noGreenUsedInGroupRef.current = false
      setSelectionTimer(5)
      setTimeout(() => {
        if (gameStateRef.current === 'playing') startCycle(newTaps, tilesRef.current)
      }, 300)
    } else if (tileState === 'red') {
      clearCycle()
      gameStateRef.current = 'dead'
      playTileRevealLose()
      setTimeout(() => playRunOver(), 100)
      const finalBalance = balance
      const finalTaps = taps
      submitScore(finalBalance, finalTaps)
      setLastRunBalance(finalBalance)
      setLastRunTaps(finalTaps)
      if (finalBalance >= 32) setShowShareButton(true)
      setGameState('dead')
    }
  }

  const formatBalance = (n: number) => {
    if (n >= 1000000000000000) return `$${(n / 1000000000000000).toFixed(1)} Quadrillion`
    if (n >= 1000000000000) return `$${(n / 1000000000000).toFixed(1)}T`
    if (n >= 1000000000) return `$${(n / 1000000000).toFixed(1)}B`
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
    return `$${n.toLocaleString()}`
  }

  const shareText = `I Stacked ${formatBalance(lastRunBalance)}\nOn the Reaction challenge.\n${lastRunTaps} taps 💸\n\nhttps://stacksgame.app`

  const handleShare = () => {
    if (navigator.share) navigator.share({ text: shareText })
    else { navigator.clipboard.writeText(shareText); alert('Copied!') }
  }

  const timerColour = selectionTimer <= 2 ? 'text-[#E74C3C]' : selectionTimer <= 3 ? 'text-[#F5C518]' : 'text-[#7F8C8D]'

  return (
    <main className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-start pt-6 px-4 pb-16">

      {/* Run Over Overlay */}
      {gameState === 'dead' && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-6"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setGameState('waiting')}>
          <div className="text-center">
            <p className="text-white/70 text-4xl font-bold tracking-widest uppercase mb-4">
              {timedOut ? 'BUST' : 'Run over'}
            </p>
            <p className={`text-white font-bold tabular-nums ${formatBalance(balance).length > 8 ? 'text-3xl' : 'text-5xl'}`}>{formatBalance(balance)}</p>
            <p className="text-white/50 text-xl mt-4">{taps} tap{taps !== 1 ? 's' : ''}</p>
            {timedOut && <p className="text-white/60 text-base mt-2">Ran out of time.</p>}
            <p className="text-white/30 text-base mt-8">tap anywhere to continue</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm w-full max-w-sm p-8 flex flex-col items-center gap-6">

        {/* Header */}
        <div className="w-full flex justify-between items-center">
          <a href="/" className="text-[#7F8C8D]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
              <path d="M9 21V12h6v9"/>
            </svg>
          </a>
          <h1 className="text-2xl font-bold text-[#1A2B3C] tracking-tight">STACKS</h1>
          <span className="w-5" />
        </div>

        <p className="text-[#7F8C8D] text-lg text-center">
          {gameState === 'playing' ? 'Choose quick before you lose.' : 'How much bank can you make?'}
        </p>

        {/* Balance */}
        <div className="text-center">
          <p key={balancePulse} className={`font-bold text-[#1A2B3C] tabular-nums ${formatBalance(balance).length > 8 ? 'text-4xl' : 'text-6xl'} ${balancePulse > 0 ? 'animate-balance-pulse' : ''}`}>
            {formatBalance(balance)}
          </p>
          {gameState === 'playing' && (
            <p className={`text-sm mt-2 font-semibold ${timerColour}`}>
              Selection Timer: {selectionTimer}
            </p>
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
              <button key={i} onClick={() => tapTile(i, tileState)}
                disabled={gameState !== 'playing'}
                className={`h-20 rounded-xl transition-all duration-100 ${bg} ${cursor}`} />
            )
          })}
        </div>

        {/* Instructions — shown in ready state */}
        {gameState === 'ready' && (
          <div className="text-center text-base text-[#7F8C8D] leading-relaxed space-y-1">
            <p className="font-bold text-[#1A2B3C] text-lg">Tap a tile before time runs out.</p>
            <p><span className="text-[#27AE60] font-semibold">Green</span> = Double Your Stack.</p>
            <p><span className="text-[#E74C3C] font-semibold">Red</span> = Game Over.</p>
          </div>
        )}

        {/* Play / Play Again */}
        {(gameState === 'ready' || gameState === 'waiting') && (
          <button onClick={startNewGame}
            className="w-full bg-[#2ECC71] text-white rounded-xl py-4 font-semibold text-base cursor-pointer active:scale-95 transition-all duration-100">
            {gameState === 'ready' ? 'Play' : 'Play Again'}
          </button>
        )}

        {/* Share */}
        {gameState === 'waiting' && showShareButton && (
          <button onClick={handleShare}
            className="w-full bg-[#F5C518] text-[#1A2B3C] rounded-xl py-4 font-semibold text-base active:scale-95 active:bg-[#D4A800] transition-all duration-100">
            Share Result
          </button>
        )}

        {/* Stats */}
        <div className="w-full border-t border-[#F4F6F8] pt-4 text-center space-y-1">
          <p className="text-[#1A2B3C] font-semibold text-base">{playerName}</p>
          <p className="text-[#7F8C8D] text-sm">Best: {formatBalance(bestBalance)} · {bestTaps} taps · {gamesPlayed} run{gamesPlayed !== 1 ? 's' : ''}</p>
          <p className="text-[#7F8C8D] text-sm">Best Today: {formatBalance(todayBest)} · {todayTaps} taps · {todayRuns} run{todayRuns !== 1 ? 's' : ''} today</p>
          <div className="flex justify-center gap-3">
            <a href="/leaderboard/play" className="text-[#3d5a80] text-sm font-semibold underline">World&apos;s Best</a>
            <span className="text-[#7F8C8D] text-base font-bold">·</span>
            <a href="/leaderboard/play/daily" className="text-[#3d5a80] text-sm font-semibold underline">Today&apos;s Best</a>
          </div>
        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-[#E0E0E0] flex items-center justify-center">
        <p className="text-[#CBD2D9] text-xs">Advertisement</p>
      </div>

    </main>
  )
}