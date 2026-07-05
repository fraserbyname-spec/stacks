'use client'

import { useRouter } from 'next/navigation'

export default function HowItWorks() {
  const router = useRouter()
  return (
    <main className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <h1 className="text-white text-3xl font-bold">How it works</h1>
        <div className="flex flex-col gap-4 text-[#999] text-sm leading-relaxed">
          <p>Each day you build a 4-colour Stack from 8 possible colours.</p>
          <p>You have 8 attempts to find the correct combination.</p>
          <p>After each guess you see:</p>
          <div className="bg-[#1A1A1A] rounded-xl p-4 flex flex-col gap-2">
            <p><span className="text-green-400 font-bold">🟢</span> Correct colour, correct position</p>
            <p><span className="text-orange-400 font-bold">🟠</span> Correct colour, wrong position</p>
            <p>Counts only — no positions revealed.</p>
          </div>
          <p>Better performance = higher interest rate applied to your balance.</p>
          <div className="bg-[#1A1A1A] rounded-xl p-4 flex flex-col gap-2 text-xs">
            <div className="flex justify-between"><span>Solve in 1</span><span className="text-green-400">+4.0%</span></div>
            <div className="flex justify-between"><span>Solve in 2</span><span className="text-green-400">+3.5%</span></div>
            <div className="flex justify-between"><span>Solve in 3</span><span className="text-green-400">+3.0%</span></div>
            <div className="flex justify-between"><span>Solve in 4</span><span className="text-green-400">+2.5%</span></div>
            <div className="flex justify-between"><span>Solve in 5</span><span className="text-green-400">+2.0%</span></div>
            <div className="flex justify-between"><span>Solve in 6</span><span className="text-green-400">+1.5%</span></div>
            <div className="flex justify-between"><span>Solve in 7</span><span className="text-green-400">+1.0%</span></div>
            <div className="flex justify-between"><span>Solve in 8</span><span className="text-green-400">+0.5%</span></div>
            <div className="flex justify-between"><span>Fail</span><span className="text-[#666]">+0%</span></div>
          </div>
          <p>Your balance compounds daily. Miss a day and it stays flat until you return.</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-white text-[#0F0F0F] rounded-2xl py-4 font-bold cursor-pointer active:scale-95 transition-all duration-100"
        >
          Got it
        </button>
      </div>
    </main>
  )
}