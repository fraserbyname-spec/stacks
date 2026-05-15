'use client'

import { useState, useEffect, useRef } from 'react'
import { playTileTap, playPulseBeat, playTileRevealWin, playTileRevealLose, playBalanceUpdate, playRunOver } from '../sounds'

type GameState = 'idle' | 'playing' | 'pulsing' | 'revealing' | 'dead' | 'waiting'

export default function OriginalGame() {
  const [balance, setBalance] = useState(1)
  const [picks, setPicks] = useState(0)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [selectedTile, setSelectedTile] = useState<number | null>(null)
  const [revealedTiles, setRevealedTiles] = useState<(false | 'win' | 'lose')[]>(Array(5).fill(false))
  const [pulseActive, setPulseActive] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [bestBalance, setBestBalance] = useState(0)
  const [bestPicks, setBestPicks] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [hasPickedThisSession, setHasPickedThisSession] = useState(false)
  const [showShareButton, setShowShareButton] = useState(false)
  const [lastRunBalance, setLastRunBalance] = useState(0)
  const [lastRunPicks, setLastRunPicks] = useState(0)
  const [shimmerKey, setShimmerKey] = useState(0)
  const [balancePulse, setBalancePulse] = useState(0)
  const [canBank, setCanBank] = useState(false)
  const [canBankDaily, setCanBankDaily] = useState(false)
  const [hadBankOption, setHadBankOption] = useState(false)
  const [hadDailyBankOption, setHadDailyBankOption] = useState(false)
  const [showBankSuccess, setShowBankSuccess] = useState(false)
  const [bankSuccessMessage, setBankSuccessMessage] = useState('')
  const [lastRunType, setLastRunType] = useState<'banked' | 'busted-with-option' | 'busted-no-option'>('busted-no-option')
  const [playerId, setPlayerId] = useState<string>('')
  const [todayBest, setTodayBest] = useState(0)
  const [todayPicks, setTodayPicks] = useState(0)
  const [todayRuns, setTodayRuns] = useState(0)
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
    const name = localStorage.getItem('stacks_name_v2')
    const best = localStorage.getItem('stacks_orig_best')
    const bestP = localStorage.getItem('stacks_orig_best_picks')
    const games = localStorage.getItem('stacks_orig_games')
    const todayKey = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
    const todayBestVal = localStorage.getItem(`stacks_orig_today_best_${todayKey}`)
    const todayPicksVal = localStorage.getItem(`stacks_orig_today_picks_${todayKey}`)
    const todayRunsVal = localStorage.getItem(`stacks_orig_today_runs_${todayKey}`)
    if (todayBestVal) setTodayBest(Number(todayBestVal))
    if (todayPicksVal) setTodayPicks(Number(todayPicksVal))
    if (todayRunsVal) setTodayRuns(Number(todayRunsVal))
    let pid = localStorage.getItem('stacks_player_id_v2')
    if (!pid) {
      pid = Math.random().toString(36).slice(2)
      localStorage.setItem('stacks_player_id_v2', pid)
    }
    setPlayerId(pid)
    if (name) setPlayerName(name)
    if (best) setBestBalance(Number(best))
    if (bestP) setBestPicks(Number(bestP))
    if (games) setGamesPlayed(Number(games))
    if (!todayBestVal && pid) {
      fetch(`/api/original-daily?player_id=${pid}`)
        .then(r => r.json())
        .then(data => {
          const top10 = data.top10 || []
          const playerInTop10 = top10.find((s: any) => s.player_id === pid)
          const playerScore = playerInTop10 || data.playerRank
          if (playerScore?.balance) {
            setTodayBest(playerScore.balance)
            setTodayPicks(playerScore.picks)
            const key = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
            localStorage.setItem(`stacks_orig_today_best_${key}`, String(playerScore.balance))
            localStorage.setItem(`stacks_orig_today_picks_${key}`, String(playerScore.picks))
          }
        })
        .catch(() => {})
    }
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
    setCanBankDaily(false)
    setHadBankOption(false)
    setHadDailyBankOption(false)
    setBalance(currentBalance)
    setPicks(currentPicks)
    setGameState('playing')
    const sid = await getSession(pid || playerId)
    setSessionId(sid)
    setShimmerKey(k => k + 1)
  }

  const startNewGame = async () => {
    setShowShareButton(false)
    setCanBank(false)
    setCanBankDaily(false)
    setHadBankOption(false)
    setHadDailyBankOption(false)
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
    setShimmerKey(k => k + 1)
  }

  const handleBank = () => {
    clearAllTimers()
    const isNewBest = balance > bestBalance
    if (isNewBest) {
      setBestBalance(balance)
      setBestPicks(picks)
      localStorage.setItem('stacks_orig_best', String(balance))
      localStorage.setItem('stacks_orig_best_picks', String(picks))
    }
    fetch('/api/original-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_name: playerName, balance, picks, player_id: playerId })
    })
    const newGames = gamesPlayed + 1
    setGamesPlayed(newGames)
    localStorage.setItem('stacks_orig_games', String(newGames))
    const todayKey = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
    const newTodayRuns = todayRuns + 1
    setTodayRuns(newTodayRuns)
    localStorage.setItem(`stacks_orig_today_runs_${todayKey}`, String(newTodayRuns))
    if (balance > todayBest) {
      setTodayBest(balance)
      setTodayPicks(picks)
      localStorage.setItem(`stacks_orig_today_best_${todayKey}`, String(balance))
      localStorage.setItem(`stacks_orig_today_picks_${todayKey}`, String(picks))
    }
    localStorage.setItem('stacks_played_before_v2', 'true')
    setLastRunBalance(balance)
    setLastRunPicks(picks)
    setCanBank(false)
    setLastRunType('banked')
    setBankSuccessMessage(balance >= 32 ? (balance > bestBalance ? 'Your new personal best!' : 'Added to the leaderboard!') : 'Stack banked!')
    setShowBankSuccess(true)
  }

  const handleBankDaily = () => {
    clearAllTimers()
    fetch('/api/original-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_name: playerName, balance, picks, player_id: playerId })
    })
    const newGames = gamesPlayed + 1
    setGamesPlayed(newGames)
    localStorage.setItem('stacks_orig_games', String(newGames))
    const todayKey = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
    const newTodayRuns = todayRuns + 1
    setTodayRuns(newTodayRuns)
    localStorage.setItem(`stacks_orig_today_runs_${todayKey}`, String(newTodayRuns))
    if (balance > todayBest) {
      setTodayBest(balance)
      setTodayPicks(picks)
      localStorage.setItem(`stacks_orig_today_best_${todayKey}`, String(balance))
      localStorage.setItem(`stacks_orig_today_picks_${todayKey}`, String(picks))
    }
    setLastRunBalance(balance)
    setLastRunPicks(picks)
    setLastRunType('banked')
    setBankSuccessMessage('Added to today\'s leaderboard!')
    setShowBankSuccess(true)
    setGameState('waiting')
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

    const serverPromise = fetch('/api/game/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: capturedSessionId, chosen_tile: index, player_id: capturedPlayerId })
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
    let isLose = false
    let losingTile = -1
    try {
      const data = prefiredPromise ? await prefiredPromise : await fetch('/api/game/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: lockedSessionId, chosen_tile: chosenIndex, player_id: lockedPlayerId })
      }).then(r => r.json())
      if (typeof data.isLose === 'boolean' && typeof data.losingTile === 'number') {
        isLose = data.isLose
        losingTile = data.losingTile
      } else {
        isLose = false
        losingTile = Math.floor(Math.random() * 5)
        while (losingTile === chosenIndex) losingTile = Math.floor(Math.random() * 5)
      }
    } catch {
      isLose = false
      losingTile = Math.floor(Math.random() * 5)
      while (losingTile === chosenIndex) losingTile = Math.floor(Math.random() * 5)
    }

    revealOrder.forEach((ti, step) => {
      addTimer(() => {
        setRevealedTiles(prev => {
          const next = [...prev] as (false | 'win' | 'lose')[]
          next[ti] = ti === losingTile ? 'lose' : 'win'
          return next
        })
        if (ti === losingTile) playTileRevealLose()
        else playTileRevealWin(ti)
      }, step * SPEED)
    })

    addTimer(() => {
      if (isLose) {
        const newGames = gamesPlayed + 1
        setGamesPlayed(newGames)
        localStorage.setItem('stacks_orig_games', String(newGames))
        const todayKey = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
        setTodayRuns(prev => {
          const newVal = prev + 1
          localStorage.setItem(`stacks_orig_today_runs_${todayKey}`, String(newVal))
          return newVal
        })
        localStorage.setItem('stacks_played_before_v2', 'true')
        playRunOver()
        setBalance(prev => {
          setLastRunBalance(prev)
          if (prev >= 32) setShowShareButton(true)
          return prev
        })
        setPicks(prev => { setLastRunPicks(prev); return prev })
        setLastRunType(hadBankOption ? 'busted-with-option' : hadDailyBankOption ? 'busted-with-option' : 'busted-no-option')
        setGameState('dead')
      } else {
        setBalance(prev => {
          const newBalance = prev * 2
          if (newBalance > bestBalance) { setCanBank(true); setCanBankDaily(false); setHadBankOption(true) }
          else if (newBalance >= 32 && newBalance > todayBest) { setCanBankDaily(true); setHadDailyBankOption(true) }
          return newBalance
        })
        playBalanceUpdate()
        setBalancePulse(k => k + 1)
        setPicks(prev => prev + 1)
        addTimer(async () => {
          setRevealedTiles(Array(5).fill(false))
          setSelectedTile(null)
          setPulseActive(false)
          setGameState('playing')
          setShimmerKey(k => k + 1)
          getSession(playerId).then(sid => setSessionId(sid))
        }, 300)
      }
    }, totalRevealTime + SPEED)
  }

  const formatBalance = (n: number) => {
    if (n >= 1000000000000000) return `$${(n / 1000000000000000).toFixed(1)}Q`
    if (n >= 1000000000000) return `$${(n / 1000000000000).toFixed(1)}T`
    if (n >= 1000000000) return `$${(n / 1000000000).toFixed(1)}B`
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
    return `$${n.toLocaleString()}`
  }

  const shareText = lastRunType === 'banked'
    ? `I just STACKED:\n${formatBalance(lastRunBalance)}\nNailed ${lastRunPicks} pick${lastRunPicks !== 1 ? 's' : ''} 💸\n\nhttps://stacksgame.app`
    : lastRunType === 'busted-with-option'
    ? `I just busted on:\n${formatBalance(lastRunBalance)}\nShould have banked it 🤦\n\nhttps://stacksgame.app`
    : `I made it to:\n${formatBalance(lastRunBalance)}\nStill short of my all time high 📈\n\nhttps://stacksgame.app`

  const handleShare = () => {
    if (navigator.share) navigator.share({ text: shareText })
    else { navigator.clipboard.writeText(shareText); alert('Copied!') }
  }

  const activeGame = (['playing', 'pulsing', 'revealing'] as GameState[]).includes(gameState)

  return (
    <main className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-start pt-6 px-4 pb-16">

      {/* Bank Success Overlay */}
      {showBankSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-6"
          style={{ backgroundColor: 'rgba(20, 80, 40, 0.88)' }}
          onClick={() => { setShowBankSuccess(false); setShowShareButton(true); setGameState('waiting') }}>
          <div className="text-center">
            <p className="text-white text-6xl font-bold mb-4">Stacked! 🏦</p>
            <p className={`text-white font-bold tabular-nums mb-4 ${formatBalance(balance).length > 12 ? 'text-2xl' : formatBalance(balance).length > 11 ? 'text-3xl' : 'text-5xl'}`}>{formatBalance(balance)}</p>
            <p className="text-white/70 text-xl mt-2">{bankSuccessMessage}</p>
            <p className="text-white/30 text-base mt-8">tap anywhere to continue</p>
          </div>
        </div>
      )}

      {/* Run Over Overlay */}
      {gameState === 'dead' && (
        <div className="fixed inset-0 flex items-center justify-center z-40 p-6"
          style={{ backgroundColor: (hadBankOption || hadDailyBankOption) ? 'rgba(120, 20, 20, 0.82)' : 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setGameState('waiting')}>
          <div className="text-center">
            <p className="text-white/70 text-4xl font-bold tracking-widest uppercase mb-4">
              {(hadBankOption || hadDailyBankOption) ? 'Bust!' : 'Run over'}
            </p>
            <p className={`text-white font-bold tabular-nums ${formatBalance(balance).length > 12 ? 'text-2xl' : formatBalance(balance).length > 11 ? 'text-3xl' : 'text-5xl'}`}>{formatBalance(balance)}</p>
            <p className="text-white/50 text-xl mt-4">{picks} pick{picks !== 1 ? 's' : ''}</p>
            {hadBankOption && <p className="text-white/60 text-xl mt-2">Should have banked that stack.</p>}
            {!hadBankOption && hadDailyBankOption && <p className="text-white/60 text-xl mt-2">Should have banked today&apos;s stack.</p>}
            <p className="text-white/30 text-base mt-8">tap anywhere to continue</p>
          </div>
        </div>
      )}

      {/* Game Card */}
      <div className="bg-white rounded-3xl shadow-sm w-full max-w-sm p-8 flex flex-col items-center gap-6">

        {/* Home icon */}
        <div className="w-full flex justify-between items-center">
          <a href="/" className="text-[#7F8C8D]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
              <path d="M9 21V12h6v9"/>
            </svg>
          </a>
          <h1 className="text-2xl font-bold text-[#1A2B3C] tracking-tight">STACKS</h1>
          <span className="text-sm text-transparent">Menu</span>
        </div>

        <div className="text-center">
          <p className="text-[#7F8C8D] text-lg mt-1">
            {hasPickedThisSession ? '1 bad tile hidden each round' : 'Pick safe tiles. Grow your stack.'}
          </p>
        </div>

        <div className="text-center">
          <p key={balancePulse} className={`font-bold text-[#1A2B3C] tabular-nums ${formatBalance(balance).length > 12 ? 'text-3xl' : formatBalance(balance).length > 11 ? 'text-4xl' : 'text-6xl'} ${balancePulse > 0 ? 'animate-balance-pulse' : ''}`}>{formatBalance(balance)}</p>
          {activeGame && <p className="text-[#7F8C8D] text-sm mt-2">Pick #{picks + 1}</p>}
        </div>

        {/* Tiles */}
        <div className="flex gap-2 w-full">
          {Array(5).fill(null).map((_, i) => {
            const state = revealedTiles[i]
            const isSelected = selectedTile === i
            const isPulseOn = gameState === 'pulsing' && isSelected && pulseActive
            const isPulseOff = gameState === 'pulsing' && isSelected && !pulseActive
            let defaultBg = 'bg-[#B0BEC5] hover:bg-[#9AABB5] shadow-inner'
            if (balance >= 500000001) defaultBg = 'bg-[#efbd0f] hover:bg-[#d4a800] shadow-inner'
            else if (balance >= 1000001) defaultBg = 'bg-[#09cdec] hover:bg-[#08b8d4] shadow-inner'
            let bg = defaultBg
            if (state === 'win') bg = 'bg-[#2ECC71]'
            else if (state === 'lose') bg = 'bg-[#E74C3C]'
            else if (isPulseOn) bg = 'bg-[#1A3A5A]'
            else if (isPulseOff) bg = 'bg-[#6A9ABB]'
            const ring = (isPulseOn || isPulseOff) ? 'ring-4 ring-[#1A3A5A] ring-offset-1' : ''
            const cursor = gameState === 'playing' ? 'cursor-pointer active:scale-95' : ''
            return (
              <button key={`${shimmerKey}-${i}`} onClick={() => pickTile(i)} disabled={gameState !== 'playing'}
                style={{ animationDelay: `${i * 80}ms` }}
                className={`flex-1 h-16 rounded-xl transition-all duration-150 ${bg} ${ring} ${cursor} ${gameState === 'playing' ? 'animate-shimmer-tile' : ''}`} />
            )
          })}
        </div>

        {/* Bank buttons */}
        <div className="w-full">
          {canBank && gameState === 'playing' ? (
            <button onClick={handleBank} className="w-full bg-white text-[#1A2B3C] rounded-xl py-4 font-semibold text-base border-2 border-[#1A2B3C] shadow-md active:scale-95 transition-all duration-100">
              Bank My Stack &nbsp; 🏦
            </button>
          ) : canBankDaily && gameState === 'playing' ? (
            <button onClick={handleBankDaily} className="w-full bg-white text-[#3d5a80] rounded-xl py-4 font-semibold text-base border-2 border-[#3d5a80] shadow-md active:scale-95 transition-all duration-100">
              Bank Today&apos;s Stack &nbsp; 💰
            </button>
          ) : (
            <div className="w-full py-4 opacity-0 pointer-events-none border-2 border-transparent rounded-xl">&nbsp;</div>
          )}
        </div>

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
          <button onClick={startNewGame} className="w-full bg-[#2ECC71] text-white rounded-xl py-4 font-semibold text-base">
            Play Again
          </button>
        )}

        {/* Share */}
        {gameState === 'waiting' && showShareButton && (
          <button onClick={handleShare} className="w-full bg-[#F5C518] text-[#1A2B3C] rounded-xl py-4 font-semibold text-base active:scale-95 active:bg-[#D4A800] transition-all duration-100">
            Share Result
          </button>
        )}

        {/* Stats */}
        <div className="w-full border-t border-[#F4F6F8] pt-4 text-center space-y-1">
          <p className="text-[#1A2B3C] font-semibold text-base">{playerName}</p>
          <p className="text-[#7F8C8D] text-sm">Best: {formatBalance(bestBalance)} · {bestPicks} picks · {gamesPlayed} run{gamesPlayed !== 1 ? 's' : ''}</p>
          <p className="text-[#7F8C8D] text-sm">Best Today: {formatBalance(todayBest)} · {todayPicks} picks · {todayRuns} run{todayRuns !== 1 ? 's' : ''} today</p>
          <div className="flex justify-center gap-3">
            <a href="/leaderboard/original" className="text-[#3d5a80] text-sm font-semibold underline">World&apos;s Best</a>
            <span className="text-[#7F8C8D] text-base font-bold">·</span>
            <a href="/leaderboard/original/daily" className="text-[#3d5a80] text-sm font-semibold underline">Today&apos;s Best</a>
          </div>
        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-[#E0E0E0] flex items-center justify-center">
        <p className="text-[#CBD2D9] text-xs">Advertisement</p>
      </div>
    </main>
  )
}