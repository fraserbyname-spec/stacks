'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { playTick, playWin, playLose } from './sounds'
import { shareBalance } from './share'

type Player = { id: string; secret: string; name: string }
type Colour = 'red' | 'black'
type Phase = 'idle' | 'spinning' | 'revealed'

const MAX_HISTORY = 10
const HISTORY_KEY = 'stacks_history'
const SIZES = [36, 32, 28, 25, 23, 21, 19, 17, 16, 15]
const OPACITIES = [1, 0.85, 0.75, 0.65, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const money = (n: number) => '$' + n.toLocaleString()
const post = (url: string, body: object) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

export default function Home() {
  const [ready, setReady] = useState(false)
  const [player, setPlayer] = useState<Player | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [rank, setRank] = useState<number | null>(null)
  const [tenth, setTenth] = useState<number | null>(null)
  const [wager, setWager] = useState(10)
  const [phase, setPhase] = useState<Phase>('idle')
  const [pick, setPick] = useState<Colour | null>(null)
  const [result, setResult] = useState<Colour | null>(null)
  const [won, setWon] = useState(false)
  const [lastBet, setLastBet] = useState(0)
  const [message, setMessage] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [note, setNote] = useState('')
  const [history, setHistory] = useState<Colour[]>([])
  const [historyTick, setHistoryTick] = useState(0)
  const [creating, setCreating] = useState(false)
  const refreshBoard = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/leaderboard?id=${id}`)
      const data = await res.json()
      setRank(data.me ? data.me.rank : null)
      setTenth(data.tenth)
    } catch {
      // rank is a nice extra, so ignore errors
    }
  }, [])

  const loadPlayer = useCallback(
    async (p: Player) => {
      const res = await post('/api/player', { action: 'load', id: p.id, secret: p.secret })
      if (!res.ok) {
        localStorage.removeItem('stacks_player')
        setPlayer(null)
        return
      }
      const data = await res.json()
      setBalance(data.balance)
      refreshBoard(p.id)
    },
    [refreshBoard]
  )

  useEffect(() => {
    const saved = localStorage.getItem('stacks_player')
    const lastWager = Number(localStorage.getItem('stacks_last_wager'))
    if (lastWager >= 1) setWager(lastWager)
    try {
      const savedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
      if (Array.isArray(savedHistory)) {
        setHistory(
          savedHistory
            .filter((c): c is Colour => c === 'red' || c === 'black')
            .slice(0, MAX_HISTORY)
        )
      }
    } catch {
      localStorage.removeItem(HISTORY_KEY)
    }
    if (saved) {
      try {
        const p = JSON.parse(saved) as Player
        setPlayer(p)
        loadPlayer(p)
      } catch {
        localStorage.removeItem('stacks_player')
      }
    }
    setReady(true)
  }, [loadPlayer])

  function addToHistory(colour: Colour) {
    setHistory((prev) => {
      const next = [colour, ...prev].slice(0, MAX_HISTORY)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      return next
    })
    setHistoryTick((t) => t + 1)
  }

    async function createPlayer() {
    if (creating) return
    setCreating(true)
    setMessage('')
    try {
      const res = await post('/api/player', { action: 'create', name: nameInput })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error)
        return
      }
      const p: Player = { id: data.id, secret: data.secret, name: data.name }
      localStorage.setItem('stacks_player', JSON.stringify(p))
      setPlayer(p)
      setBalance(data.balance)
      refreshBoard(p.id)
    } catch {
      setMessage('Something went wrong. Try again.')
    } finally {
      setCreating(false)
    }
  }

  async function spin(colour: Colour) {
    if (!player || balance === null || phase === 'spinning') return
    const amount = Math.min(wager, balance)
    if (amount < 1) return

    localStorage.setItem('stacks_last_wager', String(amount))
    setWager(amount)
    setLastBet(amount)
    setPick(colour)
    setResult(null)
    setMessage('')
    setNote('')
    setPhase('spinning')

    try {
      // Send the bet now, and let the circle pulse 3 times while we wait.
      const request = post('/api/bet', {
        id: player.id,
        secret: player.secret,
        wager: amount,
        pick: colour,
      })
      for (let i = 0; i < 3; i++) {
        playTick(i)
        await sleep(450)
      }
      const res = await request
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')

      const outcome = data.result as Colour
      setResult(outcome)
      setWon(data.won)
      setBalance(data.balance)
      setPhase('revealed')
      if (data.won) playWin()
      else playLose()
      refreshBoard(player.id)
      // Add to the history strip just after the big circle has popped
      setTimeout(() => addToHistory(outcome), 450)
    } catch (e) {
      setPhase('idle')
      setMessage(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  async function restart() {
    if (!player) return
    const res = await post('/api/player', {
      action: 'restart',
      id: player.id,
      secret: player.secret,
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(data.error)
      return
    }
    setBalance(data.balance)
    setPhase('idle')
    setResult(null)
    setMessage('')
    refreshBoard(player.id)
  }

  async function share() {
    if (balance === null) return
    const outcome = await shareBalance(balance, rank)
    if (outcome === 'copied') setNote('Copied to clipboard')
  }

  if (!ready) return <main className='min-h-dvh bg-white' />

  if (!player) {
    return (
      <main className='mx-auto flex min-h-dvh max-w-[430px] flex-col justify-center bg-white px-5 text-[#1A1A1A]'>
        <div className='text-lg font-extrabold tracking-[3px]'>STACKS</div>
        <h1 className='mt-6 text-3xl font-extrabold'>Red or black?</h1>
        <p className='mt-2 text-base text-[#6B7280]'>
          Start with $50 and see how big you can make it. What should we call you?
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createPlayer()
          }}
          className='mt-6 flex flex-col gap-3'
        >
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={16}
            placeholder='Your name'
            aria-label='Your name'
            className='h-12 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base outline-none focus:border-[#1A1A1A]'
          />
          {message && <p className='text-base text-[#C62828]'>{message}</p>}
          <button
  type='submit'
  disabled={creating}
  className='h-12 rounded-xl bg-[#1A1A1A] text-base font-bold text-white disabled:opacity-50'
>
  {creating ? 'Starting...' : 'Start playing'}
</button>
        </form>
      </main>
    )
  }

  const busy = phase === 'spinning'
  const bal = balance ?? 0
  const amount = Math.min(wager, bal)
  const chips: [string, number][] = [
    ['$5', 5],
    ['$10', 10],
    ['$25', 25],
    ['Half', Math.floor(bal / 2)],
    ['All in', bal],
  ]
  const circle =
    phase === 'revealed' && result
      ? `${result === 'red' ? 'bg-[#C62828]' : 'bg-[#1A1A1A]'} text-white animate-reveal`
      : phase === 'spinning'
        ? 'border-2 border-dashed border-[#6B7280] text-[#6B7280] animate-pulse-ring'
        : 'border-2 border-dashed border-[#E5E7EB] text-[#9CA3AF]'

  return (
    <main className='mx-auto flex min-h-dvh max-w-[430px] flex-col bg-white px-5 pb-7 pt-5 text-[#1A1A1A]'>
      <div className='flex items-center justify-between'>
        <div className='text-lg font-extrabold tracking-[3px]'>STACKS</div>
        <Link href='/leaderboard' className='flex h-11 items-center rounded-full border border-[#E5E7EB] px-4 text-base font-semibold'>
          Leaderboard
        </Link>
      </div>

      <div className='mt-5 text-center'>
        <div className='text-base text-[#6B7280]'>{`${player.name}'s bank`}</div>
        <div className='text-[72px] font-extrabold leading-[1.1]'>
          {balance === null ? '...' : money(balance)}
        </div>
        {rank !== null && (
          <div className='mt-1 text-base text-[#9CA3AF]'>
            Rank #{rank}
            {rank > 10 && tenth !== null ? ` \u00b7 Top 10 starts at ${money(tenth)}` : ''}
          </div>
        )}
      </div>

      <div
        className={`mx-auto mt-5 flex h-[120px] w-[120px] items-center justify-center rounded-full text-[40px] font-extrabold ${circle}`}
      >
        {phase === 'revealed' && result ? (
          <span className='text-[22px] tracking-widest'>{result.toUpperCase()}</span>
        ) : (
          '?'
        )}
      </div>

      <div className='mt-4 min-h-[60px] text-center'>
        {phase === 'revealed' && result ? (
          <>
            <div className={`text-[28px] font-extrabold ${won ? 'text-green-600' : 'text-[#C62828]'}`}>
              {won ? `You win +${money(lastBet)}` : `You lose -${money(lastBet)}`}
            </div>
            <div className='text-base text-[#6B7280]'>You picked {pick}</div>
          </>
        ) : message ? (
          <div className='text-base text-[#C62828]'>{message}</div>
        ) : null}
      </div>

      <div className='mt-3'>
        <div className='flex items-baseline justify-between'>
          <label htmlFor='wager' className='text-base text-[#6B7280]'>Wager</label>
          <div className='flex items-baseline text-[32px] font-extrabold'>
            <span>$</span>
            <input
              id='wager'
              type='number'
              inputMode='numeric'
              min={1}
              disabled={busy}
              value={amount > 0 ? amount : ''}
              onChange={(e) => setWager(Math.max(0, Math.floor(Number(e.target.value)) || 0))}
              className='w-28 bg-transparent text-right outline-none'
            />
          </div>
        </div>
        <div className='mt-2.5 flex gap-2'>
          {chips.map(([label, value]) => (
            <button
              key={label}
              disabled={busy || bal < 1}
              onClick={() => setWager(Math.max(1, value))}
              className={`h-11 flex-1 rounded-[10px] border text-base font-semibold ${
                amount === value
                  ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                  : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#1A1A1A]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className='mx-auto mt-5 w-fit'>
          <div className='flex h-11 items-center gap-2'>
            {SIZES.map((size, i) => {
              const colour = history[i]
              if (!colour) {
                return (
                  <div
                    key={`empty-${i}`}
                    style={{ width: size, height: size }}
                    className='shrink-0 rounded-full border-2 border-dashed border-[#E5E7EB]'
                  />
                )
              }
              return (
                <div
                  key={`${i}-${historyTick}`}
                  style={{
                    width: size,
                    height: size,
                    opacity: OPACITIES[i],
                    outline: i === 0 ? '1.5px solid #1A1A1A' : undefined,
                    outlineOffset: i === 0 ? 3 : undefined,
                  }}
                  className={`shrink-0 rounded-full ${
                    colour === 'red' ? 'bg-[#C62828]' : 'bg-[#1A1A1A]'
                  } ${historyTick > 0 ? 'animate-strip' : ''}`}
                />
              )
            })}
          </div>
          <div className='mt-2 flex justify-between text-sm text-[#9CA3AF]'>
            <span>Latest</span>
            <span>Oldest</span>
          </div>
        </div>
      </div>

      <div className='mt-auto flex flex-col gap-3 pt-6'>
        {balance === 0 ? (
          <button onClick={restart} className='h-24 rounded-2xl bg-[#1A1A1A] text-xl font-extrabold text-white'>
            Out of money. Start again with $50
          </button>
        ) : (
          <>
            <p className='text-center text-base text-[#6B7280]'>
              {busy ? 'Spinning...' : 'Pick a colour to spin'}
            </p>
            <div className='flex gap-3'>
              <button
                onClick={() => spin('red')}
                disabled={busy || balance === null || amount < 1}
                className='h-24 flex-1 rounded-2xl bg-[#C62828] text-2xl font-extrabold tracking-widest text-white disabled:opacity-50'
              >
                RED
              </button>
              <button
                onClick={() => spin('black')}
                disabled={busy || balance === null || amount < 1}
                className='h-24 flex-1 rounded-2xl bg-[#1A1A1A] text-2xl font-extrabold tracking-widest text-white disabled:opacity-50'
              >
                BLACK
              </button>
            </div>
          </>
        )}
        <button onClick={share} className='h-12 rounded-xl border border-[#E5E7EB] bg-white text-base font-semibold'>
          Share my balance
        </button>
        {note && <p className='text-center text-base text-[#6B7280]'>{note}</p>}
      </div>
    </main>
  )
}