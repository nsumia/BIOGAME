// Tiny WebAudio chiptune SFX + generative pentatonic music. No assets, no network.
export class Audio {
  constructor() { this.ctx = null; this.muted = false; this.musicOn = true; this.step = 0; this.timer = null; this.master = null; }
  init() {
    if (this.ctx) return; try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 1; this.master.connect(this.ctx.destination); this.startMusic(); } catch { this.ctx = null; }
  }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 1; }
  tone(freq, dur, type = 'square', vol = 0.05, when = 0, slide = 0) {
    if (!this.ctx || this.muted) return; const c = this.ctx, t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  noise(dur, vol = 0.04, when = 0, hp = 1000) {
    if (!this.ctx || this.muted) return; const c = this.ctx, t = c.currentTime + when, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'highpass'; f.frequency.value = hp; g.gain.value = vol; s.buffer = b; s.connect(f); f.connect(g); g.connect(this.master); s.start(t);
  }
  play(n) {
    if (!this.ctx) return;
    switch (n) {
      case 'blip': this.tone(520 + Math.random() * 120, 0.04, 'square', 0.018); break;
      case 'blip2': this.tone(700, 0.05, 'square', 0.03); break;
      case 'step': this.noise(0.04, 0.012, 0, 2500); break;
      case 'swish': this.noise(0.18, 0.04, 0, 1800); break;
      case 'catch': this.tone(660, 0.08, 'square', 0.05); this.tone(990, 0.12, 'square', 0.05, 0.08); break;
      case 'discover': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.07, i * 0.07)); break;
      case 'ok': this.tone(660, 0.08, 'square', 0.04); this.tone(880, 0.12, 'square', 0.04, 0.07); break;
      case 'bad': this.tone(220, 0.2, 'sawtooth', 0.04, 0, -80); break;
      case 'win': [523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.08, i * 0.1)); break;
      case 'open': this.tone(440, 0.06, 'square', 0.03); break;
      case 'click': this.noise(0.03, 0.08, 0, 3000); this.tone(1800, 0.04, 'square', 0.04, 0.03); break;
      case 'splash': this.noise(0.25, 0.05, 0, 600); break;
      case 'flap': this.noise(0.1, 0.03, 0, 900); break;
      case 'start': [392, 523, 659].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.07, i * 0.12)); break;
    }
  }
  startMusic() {
    const scale = [0, 2, 4, 7, 9, 12, 14, 16], base = 220, seq = [0, 2, 4, 2, 3, 1, 2, 0, 4, 5, 4, 2, 3, 2, 1, 0];
    this.timer = setInterval(() => {
      if (!this.ctx || this.muted || !this.musicOn || this.ctx.state !== 'running') return; const i = this.step++ % seq.length, bar = Math.floor(this.step / 16) % 4;
      const root = [0, 5, 3, 7][bar]; const f = base * Math.pow(2, (root + scale[seq[i]]) / 12);
      if (i % 2 === 0) this.tone(f, 0.5, 'triangle', 0.03); if (i % 8 === 0) this.tone(f / 2, 1.2, 'sine', 0.035);
    }, 340);
  }
}
