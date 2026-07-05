let ctx: AudioContext | null = null

const getCtx = () => {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Wrong guess — short low tone
export const playWrong = () => {
  const c = getCtx()
  const t = c.currentTime
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(220, t)
  osc.frequency.exponentialRampToValueAtTime(160, t + 0.15)
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.15, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.2)
}

// Correct solve — ascending chime
export const playSolve = () => {
  const c = getCtx()
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, 0)
    const gain = c.createGain()
    const t = c.currentTime + i * 0.12
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.2, t + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t)
    osc.stop(t + 0.4)
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