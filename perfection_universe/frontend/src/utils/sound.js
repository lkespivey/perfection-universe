// ── Web Audio context (lazy init on first user interaction) ──
let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

function master(gain = 0.18) {
  const g = getCtx().createGain()
  g.gain.value = gain
  g.connect(getCtx().destination)
  return g
}

// ── Core synthesizer helpers ─────────────────────────────────

function osc(type, freq, start, duration, gainVal = 0.18, destination = null) {
  try {
    const c = getCtx()
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, start)
    g.gain.setValueAtTime(gainVal, start)
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    o.connect(g)
    g.connect(destination || c.destination)
    o.start(start)
    o.stop(start + duration)
  } catch (e) {}
}

function noise(duration, gainVal = 0.06, destination = null) {
  try {
    const c = getCtx()
    const bufferSize = c.sampleRate * duration
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const source = c.createBufferSource()
    const g = c.createGain()
    source.buffer = buffer
    g.gain.setValueAtTime(gainVal, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration)
    source.connect(g)
    g.connect(destination || c.destination)
    source.start()
    source.stop(c.currentTime + duration)
  } catch (e) {}
}

// ── Public sound library ─────────────────────────────────────

export const sound = {

  // UI
  click() {
    const c = getCtx(); const t = c.currentTime
    osc('sine', 880, t, 0.06, 0.09)
    osc('sine', 660, t + 0.03, 0.05, 0.05)
  },

  hover() {
    const c = getCtx(); const t = c.currentTime
    osc('sine', 440, t, 0.04, 0.04)
  },

  // Signal chat
  transmit() {
    const c = getCtx(); const t = c.currentTime
    osc('sawtooth', 200, t, 0.04, 0.06)
    osc('sine', 800, t + 0.04, 0.12, 0.08)
    osc('sine', 1200, t + 0.1, 0.08, 0.06)
    noise(0.08, 0.04)
  },

  receive() {
    const c = getCtx(); const t = c.currentTime
    osc('sine', 400, t, 0.05, 0.05)
    osc('sine', 600, t + 0.05, 0.1, 0.07)
    osc('sine', 900, t + 0.12, 0.08, 0.05)
    noise(0.06, 0.02)
  },

  unlock() {
    const c = getCtx(); const t = c.currentTime
    ;[300, 450, 600, 800, 1000].forEach((f, i) => {
      osc('sine', f, t + i * 0.07, 0.18, 0.1)
    })
  },

  // Typewriter tick
  tick() {
    const c = getCtx(); const t = c.currentTime
    osc('square', 1800, t, 0.018, 0.025)
  },

  // Echo match glyphs
  glyph(index) {
    const freqs = [523, 659, 784, 880, 988, 1175]
    const c = getCtx(); const t = c.currentTime
    osc('sine', freqs[index % freqs.length], t, 0.18, 0.13)
    osc('triangle', freqs[index % freqs.length] * 2, t, 0.12, 0.08)
  },

  glyphCorrect() {
    const c = getCtx(); const t = c.currentTime
    ;[523, 659, 784].forEach((f, i) => osc('sine', f, t + i * 0.06, 0.15, 0.1))
  },

  glyphWrong() {
    const c = getCtx(); const t = c.currentTime
    osc('sawtooth', 150, t, 0.15, 0.12)
    osc('sawtooth', 120, t + 0.08, 0.15, 0.1)
    noise(0.2, 0.05)
  },

  // Signal alignment dial
  dialScrape(proximity) {
    const c = getCtx(); const t = c.currentTime
    const freq = 80 + proximity * 800
    osc('sawtooth', freq, t, 0.04, 0.03 + proximity * 0.06)
    if (proximity > 0.5) osc('sine', freq * 1.5, t, 0.04, proximity * 0.04)
  },

  signalFound() {
    const c = getCtx(); const t = c.currentTime
    ;[440, 550, 660, 880].forEach((f, i) => osc('sine', f, t + i * 0.08, 0.25, 0.12))
    noise(0.1, 0.02)
  },

  // Asteroid drift
  explosion() {
    const c = getCtx(); const t = c.currentTime
    noise(0.35, 0.18)
    osc('sawtooth', 80, t, 0.2, 0.15)
    osc('sawtooth', 40, t + 0.05, 0.3, 0.12)
  },

  warpIn() {
    const c = getCtx(); const t = c.currentTime
    osc('sawtooth', 2000, t, 0.3, 0.08)
    osc('sine', 800, t + 0.1, 0.25, 0.1)
    osc('sine', 400, t + 0.2, 0.2, 0.12)
  },

  // Ambient hum — returns a stop function
  ambientHum() {
    try {
      const c = getCtx()
      const o1 = c.createOscillator()
      const o2 = c.createOscillator()
      const o3 = c.createOscillator()
      const g = c.createGain()
      o1.type = 'sine'; o1.frequency.value = 55
      o2.type = 'sine'; o2.frequency.value = 82.5
      o3.type = 'sine'; o3.frequency.value = 110
      g.gain.value = 0
      ;[o1, o2, o3].forEach(o => o.connect(g))
      g.connect(c.destination)
      ;[o1, o2, o3].forEach(o => o.start())
      g.gain.linearRampToValueAtTime(0.04, c.currentTime + 3)
      return {
        stop() {
          g.gain.linearRampToValueAtTime(0, c.currentTime + 2)
          setTimeout(() => { try { o1.stop(); o2.stop(); o3.stop() } catch(e){} }, 2500)
        },
        setGain(val) { g.gain.linearRampToValueAtTime(val, c.currentTime + 0.5) }
      }
    } catch(e) { return { stop() {}, setGain() {} } }
  },

  // Page transition
  pageWhoosh() {
    const c = getCtx(); const t = c.currentTime
    osc('sine', 300, t, 0.15, 0.06)
    osc('sine', 600, t + 0.08, 0.12, 0.06)
    noise(0.12, 0.025)
  },

  // Easter egg specific
  cosmicScars() {
    const c = getCtx(); const t = c.currentTime
    ;[196, 246, 294, 370, 440].forEach((f, i) => {
      osc('sine', f, t + i * 0.12, 0.4, 0.08)
      osc('triangle', f * 2, t + i * 0.12, 0.25, 0.04)
    })
  },

  secretUnlock() {
    const c = getCtx(); const t = c.currentTime
    ;[200, 300, 450, 600, 900, 1200].forEach((f, i) => {
      osc('sine', f, t + i * 0.09, 0.3, 0.07)
    })
    noise(0.15, 0.03)
  },

  dreamFloat() {
    const c = getCtx(); const t = c.currentTime
    osc('sine', 523, t, 0.5, 0.05)
    osc('sine', 784, t + 0.15, 0.4, 0.04)
    osc('sine', 1046, t + 0.3, 0.3, 0.03)
  },
}