// All sounds generated via Web Audio API — no files needed

let ctx: AudioContext | null = null

const getCtx = () => {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

const master = 0.4 // global volume

// Low mechanical clunk — safe tumbler falling into place
export const playTileTap = () => {
  const c = getCtx()
  const t = c.currentTime

  // Noise burst for the mechanical thud
  const bufferSize = c.sampleRate * 0.08
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
  }
  const noise = c.createBufferSource()
  noise.buffer = buffer

  // Low tone underneath
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(90, t)
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.08)

  const noiseGain = c.createGain()
  noiseGain.gain.setValueAtTime(0.6 * master, t)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)

  const oscGain = c.createGain()
  oscGain.gain.setValueAtTime(0.8 * master, t)
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)

  noise.connect(noiseGain)
  noiseGain.connect(c.destination)
  osc.connect(oscGain)
  oscGain.connect(c.destination)

  noise.start(t)
  noise.stop(t + 0.1)
  osc.start(t)
  osc.stop(t + 0.1)
}

// Three rising pulse tones — tension building
export const playPulseBeat = (pulseNumber: number) => {
  const c = getCtx()
  const t = c.currentTime
  const freqs = [110, 130, 155]
  const freq = freqs[pulseNumber] ?? 155

  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t)

  const gain = c.createGain()
  gain.gain.setValueAtTime(0.5 * master, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)

  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.2)
}

// Per-tile win reveal tone — subtle, slightly varied pitch
export const playTileRevealWin = (tileIndex: number) => {
  const c = getCtx()
  const t = c.currentTime
  const freqs = [520, 560, 600, 560, 520]
  const freq = freqs[tileIndex] ?? 540

  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t)
  osc.frequency.exponentialRampToValueAtTime(freq * 1.03, t + 0.12)

  const gain = c.createGain()
  gain.gain.setValueAtTime(0.25 * master, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)

  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.2)
}

// Single flat thud — the loss
export const playTileRevealLose = () => {
  const c = getCtx()
  const t = c.currentTime

  const bufferSize = c.sampleRate * 0.15
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
  }
  const noise = c.createBufferSource()
  noise.buffer = buffer

  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(60, t)
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.15)

  const noiseGain = c.createGain()
  noiseGain.gain.setValueAtTime(0.7 * master, t)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)

  const oscGain = c.createGain()
  oscGain.gain.setValueAtTime(1.0 * master, t)
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)

  noise.connect(noiseGain)
  noiseGain.connect(c.destination)
  osc.connect(oscGain)
  oscGain.connect(c.destination)

  noise.start(t)
  noise.stop(t + 0.2)
  osc.start(t)
  osc.stop(t + 0.2)
}

// Soft ascending double tone — balance doubled
export const playBalanceUpdate = () => {
  const c = getCtx()
  const t = c.currentTime

  const notes = [440, 660]
  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t + i * 0.12)

    const gain = c.createGain()
    gain.gain.setValueAtTime(0, t + i * 0.12)
    gain.gain.linearRampToValueAtTime(0.3 * master, t + i * 0.12 + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.25)

    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t + i * 0.12)
    osc.stop(t + i * 0.12 + 0.3)
  })
}

// Quiet descending tone — run over
export const playRunOver = () => {
  const c = getCtx()
  const t = c.currentTime

  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(220, t)
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.6)

  const gain = c.createGain()
  gain.gain.setValueAtTime(0.35 * master, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7)

  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.7)
}