'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { shareBalance } from '../share'

type Row = { rank: number; name: string; balance: number; isYou: boolean }
type Me = { name: string; balance: number; rank: number }

const money = (n: number) => '$' + n.toLocaleString()

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([])
  const [me, setMe] = useState<Me | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    let id = ''
    try {
      id = JSON.parse(localStorage.getItem('stacks_player') || '{}').id || ''
    } catch {
      id = ''
    }
    fetch(`/api/leaderboard?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.top)
        setMe(d.me)
      })
      .finally(() => setLoaded(true))
  }, [])

  async function share() {
    if (!me) return
    const outcome = await shareBalance(me.balance, me.rank)
    if (outcome === 'copied') setNote('Copied to clipboard')
  }

  return (
    <main className='mx-auto flex min-h-dvh max-w-[430px] flex-col bg-white px-5 pb-7 pt-5 text-[#1A1A1A]'>
      <div className='flex items-center justify-between'>
        <Link href='/' className='flex h-11 w-16 items-center text-base font-semibold'>&larr; Back</Link>
        <div className='text-lg font-extrabold tracking-[3px]'>STACKS</div>
        <div className='w-16' />
      </div>

      <h1 className='mt-3 text-center text-[24px] font-extrabold'>Biggest Current Balances</h1>
<p className='text-center text-base text-[#6B7280]'>Top 10 Players</p>

      <div className='mt-4 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]'>
        {loaded && rows.length === 0 && (
          <div className='p-4 text-base text-[#6B7280]'>No players yet. Be the first!</div>
        )}
        {rows.map((r) => (
          <div
            key={r.rank}
            className={`flex h-11 items-center border-b border-[#E5E7EB] px-3 text-base last:border-b-0 ${
              r.isYou ? 'bg-white font-extrabold' : ''
            }`}
          >
            <div className='w-8 font-semibold text-[#6B7280]'>{r.rank}</div>
            <div className='flex-1 font-semibold'>
              {r.name}
              {r.isYou ? ' (you)' : ''}
            </div>
            <div className='font-extrabold'>{money(r.balance)}</div>
          </div>
        ))}
      </div>

      {me && me.rank > 10 && (
        <>
          <div className='my-2 text-center text-base text-[#9CA3AF]'>...</div>
          <div className='flex h-12 items-center rounded-xl border-2 border-[#1A1A1A] px-3 text-base'>
            <div className='w-8 font-semibold text-[#6B7280]'>{me.rank}</div>
            <div className='flex-1 font-extrabold'>{me.name} (you)</div>
            <div className='font-extrabold'>{money(me.balance)}</div>
          </div>
        </>
      )}

      {me && (
        <div className='mt-auto flex flex-col gap-3 pt-6'>
          <button onClick={share} className='h-12 rounded-xl border border-[#E5E7EB] bg-white text-base font-semibold'>
            Share my balance
          </button>
          {note && <p className='text-center text-base text-[#6B7280]'>{note}</p>}
        </div>
      )}
    </main>
  )
}