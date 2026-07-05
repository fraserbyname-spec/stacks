let ctx: AudioContext | null = null

const getCtx = () => {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Wrong guess — collapse sound, descending rumble
export const playWrong = () => {
  const c = getCtx()
  const t = c.currentTime

  const osc = c.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(180, t)
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.25)

  const gain = c.createGain()
  gain.gain.setValueAtTime(0.18, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)

  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.3)
}

// Correct solve — lock-in sound, four stacked clicks then chime
export const playSolve = () => {
  const c = getCtx()

  // Four quick lock clicks
  ;[0, 0.08, 0.16, 0.24].forEach((delay, i) => {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300 + i * 60, 0)
    const gain = c.createGain()
    const t = c.currentTime + delay
    gain.gain.setValueAtTime(0.15, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.07)
  })

  // Rising chime after clicks
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, 0)
    const gain = c.createGain()
    const t = c.currentTime + 0.35 + i * 0.1
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.18, t + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.5)
  })
}

// Submit guess — soft click
export const playSubmit = () => {
  const c = getCtx()
  const t = c.currentTime
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(400, t)
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.1, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.08)
}