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

// Short negative tone — wrong answer
export const playWrong = () => {
  const c = getCtx()
  const t = c.currentTime

  // Two descending tones
  const osc1 = c.createOscillator()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(330, t)
  osc1.frequency.setValueAtTime(220, t + 0.15)

  const gain1 = c.createGain()
  gain1.gain.setValueAtTime(0.2, t)
  gain1.gain.setValueAtTime(0.2, t + 0.15)
  gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.45)

  osc1.connect(gain1)
  gain1.connect(c.destination)
  osc1.start(t)
  osc1.stop(t + 0.45)
}