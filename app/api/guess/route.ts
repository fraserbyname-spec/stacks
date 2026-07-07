import { NextResponse } from 'next/server'

const COLOURS = ['RED', 'BLUE', 'YELLOW', 'GREEN', 'PURPLE', 'ORANGE', 'BLACK', 'TEAL']

// Seeded random using date string as seed
const seededRandom = (seed: string) => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const a = Math.abs(hash)
  return (n: number) => {
    const x = Math.sin(a + n) * 10000
    return x - Math.floor(x)
  }
}

const getTodaySolution = (): string[] => {
  const now = new Date()
  const dateKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  const rand = seededRandom(dateKey)
  const available = [...COLOURS]
  const solution: string[] = []
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(rand(i) * available.length)
    solution.push(available[idx])
    available.splice(idx, 1)
  }
  return solution
}

export async function POST(request: Request) {
  const body = await request.json()
  const { guess } = body

  if (!guess || !Array.isArray(guess) || guess.length !== 4) {
    return NextResponse.json({ error: 'Invalid guess' }, { status: 400 })
  }

  const solution = getTodaySolution()

  let correct = 0
  let misplaced = 0

  // Count correct positions
  const solutionRemaining: string[] = []
  const guessRemaining: string[] = []

  for (let i = 0; i < 4; i++) {
    if (guess[i] === solution[i]) {
      correct++
    } else {
      solutionRemaining.push(solution[i])
      guessRemaining.push(guess[i])
    }
  }

  // Count misplaced
  for (const colour of guessRemaining) {
    const idx = solutionRemaining.indexOf(colour)
    if (idx !== -1) {
      misplaced++
      solutionRemaining.splice(idx, 1)
    }
  }

  const solved = correct === 4

  return NextResponse.json({ correct, misplaced, solved })
}