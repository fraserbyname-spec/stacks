'use client'

import { useRouter } from 'next/navigation'

export default function HowItWorks() {
  const router = useRouter()
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <h1 className="text-[#1A1A1A] text-3xl font-bold">How it works</h1>
        <div className="flex flex-col gap-4 text-[#6B7280] text-base leading-relaxed">
          <p>Each day you build a 4-colour Stack.</p>
          <p>You have 8 attempts to complete it.</p>
          <p>Each result grows your balance.</p>
          <p>Better Stacks compound faster.</p>
          <div className="bg-[#F9FAFB] rounded-xl p-4 flex flex-col gap-3">
            <p className="text-[#1A1A1A] font-semibold text-sm">After each guess you see:</p>
            <p><span className="text-green-600 font-bold">🟢</span> Correct colour, correct position</p>
            <p><span className="text-orange-500 font-bold">🟠</span> Correct colour, wrong position</p>
            <p className="text-[#9CA3AF] text-sm">Counts only — no positions revealed.</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-[#1A1A1A] text-white rounded-2xl py-4 font-bold text-base cursor-pointer active:scale-95 transition-all duration-100"
        >
          Got it
        </button>
      </div>
    </main>
  )
}