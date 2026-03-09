const actx = new AudioContext()

document.addEventListener('click', () => {
  if (actx.state === 'suspended') actx.resume()
}, { once: true })

function noise(duration) {
  const len = Math.ceil(actx.sampleRate * duration)
  const buf = actx.createBuffer(1, len, actx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

const synths = {
  tank_shoot(vol) {
    const now = actx.currentTime

    // low sine thud
    const osc = actx.createOscillator()
    osc.frequency.setValueAtTime(90, now)
    osc.frequency.exponentialRampToValueAtTime(18, now + 0.3)
    const env = actx.createGain()
    env.gain.setValueAtTime(vol, now)
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(env).connect(actx.destination)
    osc.start(now)
    osc.stop(now + 0.3)

    // noise crack
    const src = actx.createBufferSource()
    src.buffer = noise(0.12)
    const lpf = actx.createBiquadFilter()
    lpf.type = 'lowpass'
    lpf.frequency.value = 400
    const nEnv = actx.createGain()
    nEnv.gain.setValueAtTime(vol * 0.9, now)
    nEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    src.connect(lpf).connect(nEnv).connect(actx.destination)
    src.start(now)
  },

  heli_shoot(vol) {
    const now = actx.currentTime
    const src = actx.createBufferSource()
    src.buffer = noise(0.07)
    const bpf = actx.createBiquadFilter()
    bpf.type = 'bandpass'
    bpf.frequency.value = 1400
    bpf.Q.value = 2
    const env = actx.createGain()
    env.gain.setValueAtTime(vol, now)
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.07)
    src.connect(bpf).connect(env).connect(actx.destination)
    src.start(now)
  },

  sam_shoot(vol) {
    const now = actx.currentTime
    const src = actx.createBufferSource()
    src.buffer = noise(0.45)
    const bpf = actx.createBiquadFilter()
    bpf.type = 'bandpass'
    bpf.frequency.setValueAtTime(180, now)
    bpf.frequency.exponentialRampToValueAtTime(2200, now + 0.4)
    bpf.Q.value = 3
    const env = actx.createGain()
    env.gain.setValueAtTime(vol * 0.2, now)
    env.gain.linearRampToValueAtTime(vol, now + 0.04)
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    src.connect(bpf).connect(env).connect(actx.destination)
    src.start(now)
  }
}

export function playSound(name, volume = 1) {
  if (actx.state === 'suspended') return
  synths[name]?.(volume)
}
