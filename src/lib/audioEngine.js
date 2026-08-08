/**
 * Web Audio playback engine: decodes each scene's track up front, then
 * plays the current scene on a loop and crossfades to a new scene when
 * the reading position moves. Volume/mute live only in memory (this
 * class's own fields) — nothing is persisted to disk or localStorage.
 *
 * "Phrase-aware" crossfade: a true version of this would analyse the
 * track for a beat/bar boundary near the fade point. That analysis is out
 * of scope for the PoC, so instead we do a clean equal-power crossfade
 * (the standard DJ-style fade — see crossfadeTo below) which is the
 * documented first-pass fallback in the build spec.
 */
export class AudioEngine {
  constructor() {
    this.context = null;
    this.buffers = new Map(); // audioFile -> AudioBuffer
    this.masterGain = null;
    this.activeVoice = null; // { sourceNode, gainNode, audioFile }
    this.volume = 0.8;
    this.muted = false;
  }

  _ensureContext() {
    if (!this.context) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.context = new Ctx();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.context.destination);
    }
    // iOS Safari suspends the context until a user gesture resumes it.
    if (this.context.state === "suspended") {
      this.context.resume();
    }
    return this.context;
  }

  /**
   * Fetches and decodes every scene's audio file. Missing files (e.g. the
   * placeholder tracks haven't been dropped in yet) are skipped rather
   * than throwing, so the rest of the app still works.
   */
  // import.meta.env.BASE_URL reflects vite.config's `base` (e.g. "/" in
  // dev, "/Strack/" when built for GitHub Pages), so this resolves
  // correctly regardless of which subpath the app is actually served from.
  async loadScenes(scenes, baseUrl = `${import.meta.env.BASE_URL}audio/`) {
    const context = this._ensureContext();
    await Promise.all(
      scenes.map(async (scene) => {
        if (this.buffers.has(scene.audioFile)) return;
        try {
          const response = await fetch(`${baseUrl}${scene.audioFile}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await context.decodeAudioData(arrayBuffer);
          this.buffers.set(scene.audioFile, audioBuffer);
        } catch (err) {
          console.warn(
            `[audioEngine] Could not load "${scene.audioFile}" — drop the file into public/audio/ to hear this scene.`,
            err.message
          );
        }
      })
    );
  }

  _startVoice(scene) {
    const buffer = this.buffers.get(scene.audioFile);
    if (!buffer) return null;

    const context = this._ensureContext();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const loopStart = scene.loopPoint?.start ?? 0;
    const loopEnd = scene.loopPoint?.end ?? buffer.duration;
    source.loopStart = loopStart;
    source.loopEnd = loopEnd;

    const gainNode = context.createGain();
    gainNode.gain.value = 0;
    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(0, loopStart);

    return { sourceNode: source, gainNode, audioFile: scene.audioFile };
  }

  /**
   * Crossfades from whatever is currently playing to `scene`. Safe to
   * call with the scene that's already playing (no-op) or with null
   * (fades the current voice out to silence, e.g. position outside any
   * defined scene).
   */
  crossfadeTo(scene, durationOverride) {
    if (this.activeVoice?.audioFile === scene?.audioFile) return;

    const context = this._ensureContext();
    const now = context.currentTime;
    const duration = durationOverride ?? scene?.crossfadeDuration ?? 3;

    const outgoing = this.activeVoice;
    const incoming = scene ? this._startVoice(scene) : null;

    // Equal-power crossfade: outgoing follows cos curve down, incoming
    // follows sin curve up, so the perceived loudness sums to a constant
    // instead of dipping in the middle like a simple linear fade would.
    const steps = 30;
    if (incoming) {
      const gain = incoming.gainNode.gain;
      gain.setValueCurveAtTime(
        Float32Array.from({ length: steps }, (_, i) =>
          Math.sin((i / (steps - 1)) * (Math.PI / 2))
        ),
        now,
        duration
      );
    }
    if (outgoing) {
      const gain = outgoing.gainNode.gain;
      gain.setValueCurveAtTime(
        Float32Array.from({ length: steps }, (_, i) =>
          Math.cos((i / (steps - 1)) * (Math.PI / 2))
        ),
        now,
        duration
      );
      const finishedVoice = outgoing;
      setTimeout(() => {
        finishedVoice.sourceNode.stop();
        finishedVoice.sourceNode.disconnect();
        finishedVoice.gainNode.disconnect();
      }, duration * 1000 + 50);
    }

    this.activeVoice = incoming;
  }

  setVolume(value) {
    this.volume = Math.min(1, Math.max(0, value));
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this._ensureContext().currentTime, 0.05);
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain) {
      const target = muted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(target, this._ensureContext().currentTime, 0.05);
    }
  }

  get isReady() {
    return this.context !== null;
  }

  /**
   * Must be called from inside a user-gesture handler (a click/tap) the
   * first time — browsers (notably iOS Safari) block audio from starting
   * until the AudioContext has been created/resumed in direct response
   * to user input.
   */
  enable() {
    this._ensureContext();
  }

  dispose() {
    if (this.activeVoice) {
      this.activeVoice.sourceNode.stop();
    }
    this.context?.close();
    this.context = null;
    this.buffers.clear();
    this.activeVoice = null;
  }
}
