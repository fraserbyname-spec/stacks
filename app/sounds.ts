let ctx: AudioContext | null = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq: number, delay: number, length: number, type: OscillatorType, volume: number) {
  const c = getCtx()
  if (!c) return
  const t = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + length + 0.05)
}

const WIN_NOTES = [523.25, 659.25, 783.99, 1046.5, 1318.51]
const SPARKLE = [1568, 2093, 2637]

// One rising tick per pulse
export const playTick = (i: number) => tone(330 + i * 110, 0, 0.14, 'triangle', 0.14)

export const playWin = () => {
  WIN_NOTES.forEach((f, i) => tone(f, i * 0.07, 0.3, 'triangle', 0.16))
  SPARKLE.forEach((f, i) => tone(f, 0.38 + i * 0.06, 0.45, 'sine', 0.07))
}

export const playLose = () => {
  tone(247, 0, 0.25, 'sawtooth', 0.08)
  tone(185, 0.18, 0.4, 'sawtooth', 0.08)
}