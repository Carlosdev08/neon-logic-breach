let ctx: AudioContext | null = null;

export type Sfx = "key" | "error" | "ok" | "win" | "lose" | "hint";

const TONES: Record<Sfx, [number, number][]> = {
  key: [[880, 0.03]],
  error: [[220, 0.08], [160, 0.12]],
  ok: [[660, 0.06], [990, 0.06]],
  hint: [[520, 0.06], [780, 0.08]],
  win: [[523, 0.1], [659, 0.1], [784, 0.1], [1046, 0.2]],
  lose: [[330, 0.15], [247, 0.15], [165, 0.3]],
};

export function play(sfx: Sfx, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    let t = ctx.currentTime;
    for (const [freq, dur] of TONES[sfx]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.04, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur);
      t += dur;
    }
  } catch {
    /* audio unsupported */
  }
}
