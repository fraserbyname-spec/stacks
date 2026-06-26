let ctx: AudioContext | null = null

const getCtx = () => {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Short positive chime — correct answer
export const playCorrect = () => {
  const c = getCtx()
  const t = c.currentTime

  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(523, t)      // C5
  osc.frequency.setValueAtTime(659, t + 0.08) // E5
  osc.frequency.setValueAtTime(784, t + 0.16) // G5

  const gain = c.createGain()
  gain.gain.setValueAtTime(0.2, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)

  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.4)
}

// Short negative buzz — wrong answer
export const playWrong = () => {
  const c = getCtx()
  const t = c.currentTime

  const osc = c.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(200, t)
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.3)

  const gain = c.createGain()
  gain.gain.setValueAtTime(0.15, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)

  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.3)
}