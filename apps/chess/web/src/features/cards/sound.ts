/** Small synthesised sounds for Card Chess: no audio files to download or precache. */
export type CardSound = 'flick' | 'draw' | 'skip' | 'uno' | 'penalty' | 'win' | 'lose' | 'color';

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return null;
  context ??= new window.AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(ctx: AudioContext, freq: number, start: number, length: number, type: OscillatorType = 'triangle', gain = 0.12, slideTo?: number) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + start + length);
  amp.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + length);
  osc.connect(amp).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + length + 0.02);
}

function noise(ctx: AudioContext, length: number, gain = 0.15) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * length), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  filter.type = 'highpass';
  filter.frequency.value = 1800;
  amp.gain.value = gain;
  source.buffer = buffer;
  source.connect(filter).connect(amp).connect(ctx.destination);
  source.start();
}

export function playCardSound(sound: CardSound): void {
  try {
    const ctx = audio();
    if (!ctx) return;
    switch (sound) {
      case 'flick':
        noise(ctx, 0.09);
        tone(ctx, 520, 0, 0.08, 'sine', 0.05, 300);
        break;
      case 'draw':
        noise(ctx, 0.06, 0.08);
        tone(ctx, 300, 0.02, 0.1, 'sine', 0.05, 480);
        break;
      case 'skip':
        tone(ctx, 700, 0, 0.18, 'square', 0.05, 220);
        break;
      case 'color':
        [523, 659, 784].forEach((f, i) => tone(ctx, f, i * 0.06, 0.16, 'triangle', 0.08));
        break;
      case 'uno':
        tone(ctx, 660, 0, 0.12, 'square', 0.06);
        tone(ctx, 990, 0.11, 0.22, 'square', 0.06);
        break;
      case 'penalty':
        tone(ctx, 330, 0, 0.16, 'sawtooth', 0.05);
        tone(ctx, 247, 0.15, 0.28, 'sawtooth', 0.05);
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) => tone(ctx, f, i * 0.1, 0.3, 'triangle', 0.1));
        break;
      case 'lose':
        [392, 330, 262].forEach((f, i) => tone(ctx, f, i * 0.14, 0.3, 'triangle', 0.08));
        break;
    }
  } catch {
    // Audio is a nicety; a browser that refuses it changes nothing.
  }
}
