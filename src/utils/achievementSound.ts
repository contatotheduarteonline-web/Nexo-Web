// Web Audio API synthesized achievement sound (Original, refined acoustic chime)
// No external assets, no copyrighted audio, fails silently if autoplay is restricted.

class AchievementAudioService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("concursos_achievement_sound_enabled");
      this.soundEnabled = stored === null ? true : stored === "true";
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== "undefined") {
      localStorage.setItem("concursos_achievement_sound_enabled", enabled ? "true" : "false");
      window.dispatchEvent(new CustomEvent("achievement-sound-setting-changed", { detail: { enabled } }));
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume().catch(() => {});
      }

      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Plays an original, elegant achievement chord chime.
   * Characteristics:
   * - Duration ~1.1s
   * - Soft harmonic attack
   * - Ascending chord progression (D5 -> F#5 -> A5 -> D6 with resonant shimmer)
   * - Smooth exponential decay
   * - Warm low-pass acoustic filtering
   */
  public playUnlockSound(): void {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Master output gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

      // Low-pass filter to remove harsh digital frequencies and provide warm acoustic resonance
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2600, now);
      filter.Q.setValueAtTime(1.2, now);

      masterGain.connect(filter);
      filter.connect(ctx.destination);

      // Ascending chord frequencies (D major triad with octave resolution)
      const notes = [
        { freq: 587.33, start: 0.00, duration: 0.85, gain: 0.4 },  // D5
        { freq: 739.99, start: 0.10, duration: 0.85, gain: 0.45 }, // F#5
        { freq: 880.00, start: 0.22, duration: 0.90, gain: 0.5 },  // A5
        { freq: 1174.66, start: 0.36, duration: 0.95, gain: 0.65 }, // D6 (Climax resolution)
        { freq: 1479.98, start: 0.38, duration: 0.80, gain: 0.2 },  // F#6 (Air/crystal shimmer)
      ];

      notes.forEach(({ freq, start, duration, gain: noteGainMultiplier }) => {
        const noteStart = now + start;
        const noteEnd = noteStart + duration;

        // Primary bell oscillator (pure sine)
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, noteStart);

        // Warm harmonic overtone oscillator (triangle wave at subtle gain)
        const overtoneOsc = ctx.createOscillator();
        overtoneOsc.type = "triangle";
        overtoneOsc.frequency.setValueAtTime(freq * 2, noteStart);

        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(0.0001, noteStart);
        // Fast soft attack (12ms)
        noteGain.gain.exponentialRampToValueAtTime(noteGainMultiplier, noteStart + 0.015);
        // Exponential release
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

        const overtoneGain = ctx.createGain();
        overtoneGain.gain.setValueAtTime(0.0001, noteStart);
        overtoneGain.gain.exponentialRampToValueAtTime(noteGainMultiplier * 0.25, noteStart + 0.015);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, noteEnd * 0.75);

        osc.connect(noteGain);
        overtoneOsc.connect(overtoneGain);

        noteGain.connect(masterGain);
        overtoneGain.connect(masterGain);

        osc.start(noteStart);
        overtoneOsc.start(noteStart);

        osc.stop(noteEnd);
        overtoneOsc.stop(noteEnd);
      });
    } catch {
      // Audio playback fails gracefully without interrupting application
    }
  }
}

export const achievementAudio = new AchievementAudioService();
