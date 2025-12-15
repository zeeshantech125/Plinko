class AudioService {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.ctx || !this.enabled) return;
    this.ensureContext();
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playPegHit() {
    // High pitched short ping
    this.playTone(800 + Math.random() * 200, 'sine', 0.1, 0.05);
  }

  public playDrop() {
    // Lower thud
    this.playTone(300, 'triangle', 0.2, 0.1);
  }

  public playWin(multiplier: number) {
    if (!this.ctx || !this.enabled) return;
    // Success chord
    if (multiplier > 1) {
      this.playTone(523.25, 'sine', 0.4, 0.1); // C5
      setTimeout(() => this.playTone(659.25, 'sine', 0.4, 0.1), 100); // E5
      setTimeout(() => this.playTone(783.99, 'sine', 0.6, 0.1), 200); // G5
    } else {
      // Soft fail
       this.playTone(200, 'sine', 0.3, 0.05);
    }
  }

  public playClick() {
    this.playTone(1200, 'square', 0.05, 0.02);
  }
}

export const audioService = new AudioService();
