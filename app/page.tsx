'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [nameInput, setNameInput] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [showNameEntry, setShowNameEntry] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const name = localStorage.getItem('stacks_name_v2')
    if (name) setPlayerName(name)
    else setShowNameEntry(true)
  }, [])

  const saveName = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    localStorage.setItem('stacks_name_v2', trimmed)
    setPlayerName(trimmed)
    setShowNameEntry(false)
  }

  return (
    <main className="min-h-screen bg-[#F4F6F8] flex flex-col items-center justify-center p-4">

      {showNameEntry && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
            <h2 className="text-2xl font-bold text-[#1A2B3C] mb-2">Welcome to Stacks</h2>
            <p className="text-[#7F8C8D] text-sm mb-6">What should we call you on the leaderboards?</p>
            <input
              type="text"
              maxLength={12}
              placeholder="Your name"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              className="w-full border border-[#CBD2D9] rounded-xl px-4 py-3 text-[#1A2B3C] text-base outline-none focus:border-[#1A3A5A] mb-4"
            />
            <button onClick={saveName} className="w-full bg-[#1A3A5A] text-white rounded-xl py-3 font-semibold text-base">
              Let&apos;s go
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        <div className="text-center">
          <h1 className="text-5xl font-bold text-[#1A2B3C] tracking-tight">STACKS 💸</h1>
          {playerName && <p className="text-[#7F8C8D] text-lg mt-2">Hey {playerName} — choose your game.</p>}
        </div>

        <div className="flex flex-col gap-4 w-full">

          <button
            onClick={() => router.push('/original')}
            className="bg-white rounded-2xl p-6 w-full text-center shadow-sm border-2 border-[#1A3A5A] active:scale-95 hover:shadow-md cursor-pointer transition-all duration-150"
          >
            <p className="text-[#1A2B3C] text-xl font-bold mb-2">THE PICK</p>
<p className="text-[#7F8C8D] text-lg">
  Slow and Risky.
</p>
          </button>

          <button
            onClick={() => router.push('/play')}
            className="bg-white rounded-2xl p-6 w-full text-center shadow-sm border-2 border-[#2ECC71] active:scale-95 hover:shadow-md cursor-pointer transition-all duration-150"
          >
            <p className="text-[#1A2B3C] text-xl font-bold mb-2">THE TAP</p>
<p className="text-[#7F8C8D] text-lg">
  Fast and Frantic.
</p>
          </button>

        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-[#E0E0E0] flex items-center justify-center">
        <p className="text-[#CBD2D9] text-xs">Advertisement</p>
      </div>

    </main>
  )
}