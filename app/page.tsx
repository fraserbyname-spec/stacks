'use client'

import { useState, useEffect, useRef } from 'react'
import { playTileTap, playTileRevealWin, playTileRevealLose, playBalanceUpdate, playRunOver } from './sounds'

type GameState = 'idle' | 'playing' | 'dead' | 'waiting'

type TileState = 'grey' | 'green' | 'red'

export default function Home() {
  const [balance, setBalance] = useState(1)
  const [picks, setPicks] = useState(0)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [tiles, setTiles] = useState<TileState[]>(Array(5).fill('grey'))
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
  const [dwellTime, setDwellTime] = useState(900)
  const [tileCount, setTileCount] = useState(5)
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const picksRef = useRef(0)
  const dwellRef = useRef(900)
  const tileCountRef = useRef(5)
  const gameStateRef = useRef<GameState>('idle')

  const clearAllTimers = () => {
    timers.current.forEach(t => clearTimeout(t))
    timers.current = []
    if (cycleRef.current) clearTimeout(cycleRef.current)
  }

  const addTimer = (fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay)
    timers.current.push(t)
    return t
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
    if (todayPicksVal) setTodayPicks(Number(todayPicksVal))
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
    if (bestP) setBestPicks(Number(bestP))
    if (games) setGamesPlayed(Number(games))
    if (played) setHasPlayedBefore(true)
    if (!todayBestVal && pid) {
      fetch(`/api/leaderboard/daily?player_id=${pid}`)
        .then(r => r.json())
        .then(data => {
          const top10 = data.top10 || []
          const playerInTop10 = top10.find((s: any) => s.player_id === pid)
          const playerScore = playerInTop10 || data.playerRank
          if (playerScore && playerScore.balance) {
            setTodayBest(playerScore.balance)
            setTodayPicks(playerScore.picks)
            const key = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
            localStorage.setItem(`stacks_today_best_${key}`, String(playerScore.balance))
            localStorage.setItem(`stacks_today_picks_${key}`, String(playerScore.picks))
          }
        })
        .catch(() => {})
    }
    return () => clearAllTimers()
  }, [])

  useEffect(() => {
    if (playerName && playerId && gameState === 'idle') startRound(1, 0)
  }, [playerName, playerId])

  // Keep refs in sync so cycle timer always has current values
  useEffect(() => { picksRef.current = picks }, [picks])
  useEffect(() => { dwellRef.current = dwellTime }, [dwellTime])
  useEffect(() => { tileCountRef.current = tileCount }, [tileCount])
  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  const getActiveTileConfig = (pickCount: number) => {
    if (pickCount >= 31) return { total: 7, green: 1, red: 4 }
    if (pickCount >= 21) return { total: 6, green: 1, red: 3 }
    return { total: 5, green: 1, red: 2 }
  }

  const generateTiles = (pickCount: number): TileState[] => {
    const config = getActiveTileConfig(pickCount)
    const tileArray: TileState[] = Array(config.total).fill('grey')
    const positions = [...Array(config.total).keys()]

    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]]
    }

    // Assign green and red
    tileArray[positions[0]] = 'green'
    for (let i = 1; i <= config.red; i++) {
      tileArray[positions[i]] = 'red'
    }

    return tileArray
  }

  const startCycle = (currentPicks: number, currentDwell: number) => {
    if (cycleRef.current) clearTimeout(cycleRef.current)
    if (gameStateRef.current !== 'playing') return

    const newTiles = generateTiles(currentPicks)
    const config = getActiveTileConfig(currentPicks)
    setTiles(newTiles)
    setTileCount(config.total)

    cycleRef.current = setTimeout(() => {
      if (gameStateRef.current === 'playing') {
        startCycle(picksRef.current, dwellRef.current)
      }
    }, currentDwell)
  }

  const startRound = (currentBalance: number, currentPicks: number) => {
    clearAllTimers()
    setBalance(currentBalance)
    setPicks(currentPicks)
    picksRef.current = currentPicks
    const newDwell = Math.max(150, 900 - currentPicks * 25)
    setDwellTime(newDwell)
    dwellRef.current = newDwell
    const config = getActiveTileConfig(currentPicks)
    setTileCount(config.total)
    tileCountRef.current = config.total
    setCanBank(false)
    setCanBankDaily(false)
    setHadBankOption(false)
    setHadDailyBankOption(false)
    setGameState('playing')
    gameStateRef.current = 'playing'
    setShimmerKey(k => k + 1)
    setTimeout(() => startCycle(currentPicks, newDwell), 100)
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
    setShowBankSuccess(false)
    setHasPickedThisSession(true)
    startRound(1, 0)
  }

  const handleBank = () => {
    clearAllTimers()
    gameStateRef.current = 'waiting'
    const isNewBest = balance > bestBalance
    if (isNewBest) {
      setBestBalance(balance)
      setBestPicks(picks)
      localStorage.setItem('stacks_best_v2', String(balance))
      localStorage.setItem('stacks_best_picks_v2', String(picks))
    }
    fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_name: playerName, balance, picks, player_id: playerId })
    })
    const newGames = gamesPlayed + 1
    setGamesPlayed(newGames)
    localStorage.setItem('stacks_games_v2', String(newGames))
    const todayKey = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
    const newTodayRuns = todayRuns + 1
    setTodayRuns(newTodayRuns)
    localStorage.setItem(`stacks_today_runs_${todayKey}`, String(newTodayRuns))
    if (balance > todayBest) {
      setTodayBest(balance)
      setTodayPicks(picks)
      localStorage.setItem(`stacks_today_best_${todayKey}`, String(balance))
      localStorage.setItem(`stacks_today_picks_${todayKey}`, String(picks))
    }
    localStorage.setItem('stacks_played_before_v2', 'true')
    setHasPlayedBefore(true)
    setLastRunBalance(balance)
    setLastRunPicks(picks)
    setCanBank(false)
    setLastRunType('banked')
    if (balance >= 32) {
      setBankSuccessMessage(isNewBest ? 'Your new personal best!' : 'Added to the leaderboard!')
    } else {
      setBankSuccessMessage('Stack banked!')
    }
    setShowBankSuccess(true)
    setGameState('waiting')
  }

  const handleBankDaily = () => {
    clearAllTimers()
    gameStateRef.current = 'waiting'
    fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_name: playerName, balance, picks, player_id: playerId, daily_only: true })
    })
    const newGames = gamesPlayed + 1
    setGamesPlayed(newGames)
    localStorage.setItem('stacks_games_v2', String(newGames))
    localStorage.setItem('stacks_played_before_v2', 'true')
    setHasPlayedBefore(true)
    setLastRunBalance(balance)
    setLastRunPicks(picks)
    setCanBankDaily(false)
    const todayKey = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
    const newTodayRuns = todayRuns + 1
    setTodayRuns(newTodayRuns)
    localStorage.setItem(`stacks_today_runs_${todayKey}`, String(newTodayRuns))
    if (balance > todayBest) {
      setTodayBest(balance)
      setTodayPicks(picks)
      localStorage.setItem(`stacks_today_best_${todayKey}`, String(balance))
      localStorage.setItem(`stacks_today_picks_${todayKey}`, String(picks))
    }
    setLastRunType('banked')
    setBankSuccessMessage('Added to today\'s leaderboard!')
    setShowBankSuccess(true)
    setGameState('waiting')
  }

  const tapTile = (index: number, tileState: TileState) => {
    if (gameState !== 'playing') return
    if (tileState === 'grey') return // grey taps do nothing
    setHasPickedThisSession(true)

    if (tileState === 'green') {
      // Success
      playTileRevealWin(index)
      clearAllTimers()
      const newBalance = balance * 2
      const newPicks = picks + 1
      const newDwell = Math.max(150, 900 - newPicks * 25)
      setBalance(newBalance)
      setBalancePulse(k => k + 1)
      playBalanceUpdate()
      setPicks(newPicks)
      picksRef.current = newPicks
      setDwellTime(newDwell)
      dwellRef.current = newDwell

      // Check bank conditions
      if (newBalance > bestBalance) {
        setCanBank(true)
        setCanBankDaily(false)
        setHadBankOption(true)
      } else if (newBalance >= 32 && newBalance > todayBest) {
        setCanBankDaily(true)
        setHadDailyBankOption(true)
      }

      // Brief pause then continue cycling
      setTimeout(() => {
        if (gameStateRef.current === 'playing') {
          startCycle(newPicks, newDwell)
          setShimmerKey(k => k + 1)
        }
      }, 400)

    } else if (tileState === 'red') {
      // Bust
      playTileTap()
      clearAllTimers()
      gameStateRef.current = 'dead'

      setTimeout(() => {
        playTileRevealLose()
        playRunOver()
      }, 100)

      setGamesPlayed(prev => {
        const newGames = prev + 1
        localStorage.setItem('stacks_games_v2', String(newGames))
        return newGames
      })
      const todayKey = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]
      setTodayRuns(prev => {
        const newVal = prev + 1
        localStorage.setItem(`stacks_today_runs_${todayKey}`, String(newVal))
        return newVal
      })
      localStorage.setItem('stacks_played_before_v2', 'true')
      setHasPlayedBefore(true)
      setLastRunBalance(balance)
      setLastRunPicks(picks)
      if (balance >= 32) setShowShareButton(true)
      setLastRunType(hadBankOption ? 'busted-with-option' : hadDailyBankOption ? 'busted-with-option' : 'busted-no-option')
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

  const shareText = lastRunType === 'banked'
    ? `I just STACKED:\n${formatBalance(lastRunBalance)}\nNailed ${lastRunPicks} pick${lastRunPicks !== 1 ? 's' : ''} 💸\n\nhttps://stacksgame.app`
    : lastRunType === 'busted-with-option'
    ? `I just busted on:\n${formatBalance(lastRunBalance)}\nShould have banked it 🤦\n\nhttps://stacksgame.app`
    : `I made it to:\n${formatBalance(lastRunBalance)}\nStill short of my all time high 📈\n\nhttps://stacksgame.app`

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text: shareText })
    } else {
      navigator.clipboard.writeText(shareText)
      alert('Copied to clipboard!')
    }
  }

  const activeGame = gameState === 'playing'

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
          style={{ backgroundColor: (hadBankOption || hadDailyBankOption) ? 'rgba(120, 20, 20, 0.82)' : 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setGameState('waiting')}
        >
          <div className="text-center">
            <p className="text-white/70 text-4xl font-bold tracking-widest uppercase mb-4">
              {(hadBankOption || hadDailyBankOption) ? 'Bust!' : 'Run over'}
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
            {!hadBankOption && hadDailyBankOption && (
              <p className="text-white/60 text-xl mt-2">Should have banked today&apos;s stack.</p>
            )}
            <p className="text-white/30 text-base mt-8">tap anywhere to continue</p>
          </div>
        </div>
      )}

      {/* Game Card */}
      <div className="bg-white rounded-3xl shadow-sm w-full max-w-sm p-8 flex flex-col items-center gap-6">

        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1A2B3C] tracking-tight">STACKS</h1>
          <p className="text-[#7F8C8D] text-lg mt-1">
            {hasPickedThisSession ? '1 green tile hidden each round' : 'How much bank can you make?'}
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
          {activeGame && (
            <p className="text-[#7F8C8D] text-sm mt-2">Pick #{picks + 1}</p>
          )}
        </div>

        {/* Tiles */}
        <div className="flex gap-2 w-full">
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
                className={`flex-1 h-16 rounded-xl transition-all duration-150 ${bg} ${cursor}`}
              />
            )
          })}
        </div>

        {/* Bank buttons */}
        <div className="w-full">
          {canBank && gameState === 'playing' ? (
            <button
              onClick={handleBank}
              className="w-full bg-white text-[#1A2B3C] rounded-xl py-4 font-semibold text-base border-2 border-[#1A2B3C] shadow-md active:scale-95 active:shadow-sm transition-all duration-100"
            >
              Bank My Stack &nbsp; 🏦
            </button>
          ) : canBankDaily && gameState === 'playing' ? (
            <button
              onClick={handleBankDaily}
              className="w-full bg-white text-[#3d5a80] rounded-xl py-4 font-semibold text-base border-2 border-[#3d5a80] shadow-md active:scale-95 active:shadow-sm transition-all duration-100"
            >
              Bank Today&apos;s Stack &nbsp; 💰
            </button>
          ) : (
            <div className="w-full py-4 opacity-0 pointer-events-none border-2 border-transparent rounded-xl">
              &nbsp;
            </div>
          )}
        </div>

        {/* Instructions */}
        {!hasPickedThisSession && gameState === 'playing' && (
          <div className="text-center text-base text-[#7F8C8D] leading-relaxed space-y-1">
            <p className="font-bold text-[#1A2B3C] text-lg">Bank your Stack before you bust!</p>
            <p>Tap the <span className="text-[#27AE60] font-semibold">green</span> tile to double your money.</p>
            <p>Tap a <span className="text-[#E74C3C] font-semibold">red</span> tile and your run is over.</p>
            <p>Tap <span className="text-[#7F8C8D] font-semibold">grey</span> tiles to wait.</p>
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
            Best: {formatBalance(bestBalance)} <span className="text-[#7F8C8D]">·</span> {bestPicks} picks <span className="text-[#7F8C8D]">·</span> {gamesPlayed} run{gamesPlayed !== 1 ? 's' : ''}
          </p>
          <p className="text-[#7F8C8D] text-sm">
            Best Today: {formatBalance(todayBest)} <span className="text-[#7F8C8D]">·</span> {todayPicks} picks <span className="text-[#7F8C8D]">·</span> {todayRuns} run{todayRuns !== 1 ? 's' : ''} today
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