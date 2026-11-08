import { AlarmSoundType } from '../types';

class AlarmAudioEngine {
  private audioCtx: AudioContext | null = null;
  private isAlarmPlaying: boolean = false;
  private loopIntervalId: any = null;
  private currentVolume: number = 0.85; // 0.0 to 1.0
  private currentSoundType: AlarmSoundType = 'digital';
  private vibrationIntervalId: any = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Pre-unlock audio on user interaction
  public unlockAudio(): void {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      // Play a short inaudible sound buffer to unlock iOS Safari
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // ignore
    }
  }

  public isPlaying(): boolean {
    return this.isAlarmPlaying;
  }

  // Play a single cycle of the designated sound
  private playCycle(soundType: AlarmSoundType, volumeFraction: number) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1.0, volumeFraction)), now);
      masterGain.connect(ctx.destination);

      if (soundType === 'digital') {
        // Classic 4-beep digital wristwatch pattern (beep beep beep beep ... pause)
        const beeps = [0, 0.12, 0.24, 0.36];
        beeps.forEach((delay) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(2048, now + delay); // crisp digital alarm freq

          noteGain.gain.setValueAtTime(0, now + delay);
          noteGain.gain.linearRampToValueAtTime(0.4, now + delay + 0.01);
          noteGain.gain.setValueAtTime(0.4, now + delay + 0.07);
          noteGain.gain.linearRampToValueAtTime(0, now + delay + 0.09);

          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start(now + delay);
          osc.stop(now + delay + 0.1);
        });
      } else if (soundType === 'chime') {
        // Soft calming musical chime chord (E5, B5, G#5, E6)
        const notes = [659.25, 830.61, 987.77, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          const startTime = now + idx * 0.12;
          noteGain.gain.setValueAtTime(0, startTime);
          noteGain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);

          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start(startTime);
          osc.stop(startTime + 0.95);
        });
      } else if (soundType === 'pulse') {
        // Urgent 2-tone medical alarm (high tone / low tone pulse)
        const osc = ctx.createOscillator();
        const pulseGain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.setValueAtTime(800, now + 0.25);
        osc.frequency.setValueAtTime(950, now + 0.5);
        osc.frequency.setValueAtTime(800, now + 0.75);

        // Lowpass filter to make sawtooth pleasant and clear
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);

        pulseGain.gain.setValueAtTime(0.25, now);
        pulseGain.gain.linearRampToValueAtTime(0.01, now + 0.95);

        osc.connect(filter);
        filter.connect(pulseGain);
        pulseGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 1.0);
      } else if (soundType === 'marimba') {
        // Bright acoustic marimba notes (C5, G5, C6)
        const marimbaNotes = [523.25, 659.25, 783.99, 1046.5];
        marimbaNotes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);

          const t = now + idx * 0.15;
          noteGain.gain.setValueAtTime(0, t);
          noteGain.gain.linearRampToValueAtTime(0.4, t + 0.015);
          noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.55);
        });
      } else if (soundType === 'hospital') {
        // Clinical harmonic alert chime (two high bells)
        const tones = [1046.5, 1318.5]; // C6, E6
        tones.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);

          const t = now + idx * 0.18;
          noteGain.gain.setValueAtTime(0, t);
          noteGain.gain.linearRampToValueAtTime(0.35, t + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

          osc.connect(noteGain);
          noteGain.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.85);
        });
      }
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }

  // Starts the continuous looping alarm sound
  public startAlarm(soundType: AlarmSoundType = 'digital', volumePercent: number = 85, vibrate: boolean = true) {
    if (this.isAlarmPlaying) return;

    this.isAlarmPlaying = true;
    this.currentSoundType = soundType;
    this.currentVolume = Math.max(0.1, Math.min(100, volumePercent)) / 100;

    // Play first cycle immediately
    this.playCycle(this.currentSoundType, this.currentVolume);

    // Continuous loop interval: 1.25s interval for realism
    const intervalMs = this.currentSoundType === 'chime' ? 1400 : 1200;
    this.loopIntervalId = setInterval(() => {
      if (!this.isAlarmPlaying) return;
      this.playCycle(this.currentSoundType, this.currentVolume);
    }, intervalMs);

    // Physical vibration if supported by mobile device
    if (vibrate && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 500]);
        this.vibrationIntervalId = setInterval(() => {
          if (!this.isAlarmPlaying) return;
          try {
            navigator.vibrate([300, 150, 300, 150, 500]);
          } catch (e) {}
        }, 1500);
      } catch (e) {}
    }
  }

  // Stops the continuous alarm sound & vibration immediately
  public stopAlarm(): void {
    this.isAlarmPlaying = false;
    if (this.loopIntervalId) {
      clearInterval(this.loopIntervalId);
      this.loopIntervalId = null;
    }
    if (this.vibrationIntervalId) {
      clearInterval(this.vibrationIntervalId);
      this.vibrationIntervalId = null;
    }
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
  }

  // Previews sound for 2 seconds (in Settings or Test modal)
  public previewSound(soundType: AlarmSoundType, volumePercent: number = 85): void {
    this.stopAlarm();
    const vol = Math.max(0.1, Math.min(100, volumePercent)) / 100;
    this.playCycle(soundType, vol);
    setTimeout(() => {
      this.playCycle(soundType, vol);
    }, 1000);
  }

  // Spoken voice assistant for medicine name & instructions
  public speakReminder(medicineName: string, dosage: string, instructions?: string): void {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const text = `Time to take your ${medicineName}, ${dosage}. ${instructions ? instructions : ''}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = Math.min(1.0, this.currentVolume);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }
}

export const audioEngine = new AlarmAudioEngine();
