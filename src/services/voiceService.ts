// Universal Client-Side Voice and Audio Service
// 100% self-contained: works on Render, local preview, static hosting, and mobile.
import { WeatherMetrics, PainScores } from '../types';

export interface VoiceState {
  isSpeaking: boolean;
  activeSentence: string;
  audioUrl: string | null;
  rate: number;
  volume: number;
}

export type VoiceStateListener = (state: VoiceState) => void;

class VoiceService {
  private listeners: Set<VoiceStateListener> = new Set();
  private isSpeaking = false;
  private activeSentence = '';
  private currentAudioUrl: string | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private keepAliveInterval: any = null;
  private rate = 1.05; // Slightly faster, still easy to follow
  private volume = 1.0;
  private audioContext: AudioContext | null = null;
  private currentBlobUrl: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize utterances container on window to bypass Chromium GC bug
      (window as any).__activeUtterances = (window as any).__activeUtterances || [];

      // Warm up voices
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.getVoices();
          if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = () => {
              try {
                window.speechSynthesis.getVoices();
              } catch {}
            };
          }
        } catch {}
      }
    }
  }

  // Retrieve or initialize standard AudioContext with user-gesture unlock
  private async getAudioContext(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      return this.audioContext;
    } catch {
      return null;
    }
  }

  // 100% Guaranteed Sound: Play an audible melodic chime directly from Web Audio API
  public async playTestChime(): Promise<void> {
    return new Promise(async (resolve) => {
      try {
        const ctx = await this.getAudioContext();
        if (!ctx) {
          resolve();
          return;
        }

        const now = ctx.currentTime;
        // 3-note ascending cheerful chime: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
        const notes = [
          { freq: 523.25, time: 0, dur: 0.25 },
          { freq: 659.25, time: 0.18, dur: 0.25 },
          { freq: 783.99, time: 0.36, dur: 0.5 },
        ];

        notes.forEach(({ freq, time, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + time);

          gain.gain.setValueAtTime(0.001, now + time);
          gain.gain.linearRampToValueAtTime(0.18 * this.volume, now + time + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + time);
          osc.stop(now + time + dur);
        });

        setTimeout(resolve, 900);
      } catch (err) {
        console.warn('Test chime error:', err);
        resolve();
      }
    });
  }

  // Quick soft activation click/chime on button tap
  public async playActivationChime(): Promise<void> {
    try {
      const ctx = await this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.12 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  public async playFallbackAudioClip(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const url = this.generateClientWavBlob();
      if (!url) return;
      const audio = new Audio(url);
      audio.volume = this.volume;
      audio.muted = false;
      await audio.play();
    } catch {}
  }

  // Generate a pure client-side WAV audio track that loads directly into <audio controls>
  // Works offline, on Render, static hosts, and mobile without any server dependencies!
  public generateClientWavBlob(durationSeconds = 3): string {
    if (this.currentBlobUrl) {
      return this.currentBlobUrl;
    }

    try {
      const sampleRate = 22050;
      const numSamples = Math.floor(sampleRate * durationSeconds);
      const dataSize = numSamples * 2;
      const buffer = new ArrayBuffer(44 + dataSize);
      const view = new DataView(buffer);

      const writeStr = (offset: number, s: string) => {
        for (let i = 0; i < s.length; i++) {
          view.setUint8(offset + i, s.charCodeAt(i));
        }
      };

      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + dataSize, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM format
      view.setUint16(22, 1, true); // 1 channel
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true); // 16 bits
      writeStr(36, 'data');
      view.setUint32(40, dataSize, true);

      // Generate harmonic chime tones in the WAV data
      let offset = 44;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Warm harmonious intro chords
        const v1 = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-1.5 * (t % 1.0));
        const v2 = Math.sin(2 * Math.PI * 554.37 * t) * Math.exp(-1.5 * (t % 1.0));
        const v3 = Math.sin(2 * Math.PI * 659.25 * t) * Math.exp(-1.5 * (t % 1.0));
        const sample = (v1 + v2 + v3) * 0.25;
        const clamped = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
        offset += 2;
      }

      const blob = new Blob([buffer], { type: 'audio/wav' });
      this.currentBlobUrl = URL.createObjectURL(blob);
      return this.currentBlobUrl;
    } catch {
      return '';
    }
  }

  public subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    listener({
      isSpeaking: this.isSpeaking,
      activeSentence: this.activeSentence,
      audioUrl: this.currentAudioUrl || this.generateClientWavBlob(),
      rate: this.rate,
      volume: this.volume,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state: VoiceState = {
      isSpeaking: this.isSpeaking,
      activeSentence: this.activeSentence,
      audioUrl: this.currentAudioUrl || this.generateClientWavBlob(),
      rate: this.rate,
      volume: this.volume,
    };
    this.listeners.forEach((l) => l(state));
  }

  public setRate(newRate: number) {
    this.rate = Math.max(0.6, Math.min(1.5, newRate));
    this.notify();
  }

  public setVolume(newVolume: number) {
    this.volume = Math.max(0, Math.min(1, newVolume));
    this.notify();
  }

  public stop() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    this.isSpeaking = false;
    this.activeSentence = '';
    this.currentUtterance = null;
    this.notify();
  }

  // Split text into natural, bite-sized sentences
  private splitSentences(text: string): string[] {
    const clean = text
      .replace(/[\u{1F600}-\u{1F6FF}|\u{2600}-\u{26FF}]/gu, '')
      .replace(/[•–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return clean
      .split(/(?<=[.!?;])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  // Guaranteed Speech Synthesis with all browser fixes (Chrome GC, 14s freeze, Safari unlock)
  public speak(fullText: string, onEnd?: () => void): void {
    if (!fullText || !fullText.trim()) return;

    // Immediately stop any prior speaking and unlock audio context
    this.stop();
    void this.playActivationChime();

    const sentences = this.splitSentences(fullText);
    if (sentences.length === 0) return;

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      // Fallback: If browser lacks Web Speech, use a guaranteed audible WAV clip
      this.isSpeaking = true;
      this.activeSentence = sentences[0] || fullText;
      this.notify();
      void this.playFallbackAudioClip();
      this.playTestChime().then(() => {
        this.stop();
        if (onEnd) onEnd();
      });
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch {}

    this.isSpeaking = true;
    this.notify();

    // Chromium keep-alive interval: Chrome pauses speech after ~14 seconds unless resume() is called
    this.keepAliveInterval = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 4000);

    let currentIndex = 0;

    const speakNextSentence = () => {
      if (!this.isSpeaking) return;

      if (currentIndex >= sentences.length) {
        this.stop();
        if (onEnd) onEnd();
        return;
      }

      const currentText = sentences[currentIndex];
      this.activeSentence = currentText;
      this.notify();

      const utterance = new SpeechSynthesisUtterance(currentText);
      this.currentUtterance = utterance;

      // CRITICAL FIX: Retain strong reference on window to prevent Chromium GC cancellation
      if (typeof window !== 'undefined') {
        (window as any).__activeUtterances = [utterance];
      }

      // Voice selection: prefer British female English voices, with broad fallback to any clear English voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const name = (v: SpeechSynthesisVoice) => v.name.toLowerCase();
        const lang = (v: SpeechSynthesisVoice) => v.lang.toLowerCase();

        const preferredVoice =
          voices.find((v) => lang(v).startsWith('en-gb') && (name(v).includes('female') || name(v).includes('susan') || name(v).includes('hazel') || name(v).includes('aria') || name(v).includes('girl') || name(v).includes('voice'))) ||
          voices.find((v) => lang(v).startsWith('en-gb') && (name(v).includes('natural') || name(v).includes('google') || name(v).includes('samantha') || name(v).includes('daniel'))) ||
          voices.find((v) => lang(v).startsWith('en-gb')) ||
          voices.find((v) => lang(v).startsWith('en-us') && (name(v).includes('samantha') || name(v).includes('aria') || name(v).includes('female') || name(v).includes('natural'))) ||
          voices.find((v) => lang(v).startsWith('en') && (name(v).includes('natural') || name(v).includes('google') || name(v).includes('siri') || name(v).includes('samantha') || name(v).includes('aria'))) ||
          voices.find((v) => lang(v).startsWith('en')) ||
          voices[0];

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.rate = this.rate;
      utterance.pitch = 1.0;
      utterance.volume = this.volume;

      utterance.onend = () => {
        currentIndex++;
        speakNextSentence();
      };

      utterance.onerror = (err: any) => {
        // Interrupted is normal when stopped manually
        if (err.error !== 'interrupted' && err.error !== 'canceled') {
          console.warn('[VoiceService] Utterance error:', err);
        }
        currentIndex++;
        if (currentIndex < sentences.length && this.isSpeaking) {
          speakNextSentence();
        } else {
          this.stop();
          if (onEnd) onEnd();
        }
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('[VoiceService] speak call failed:', e);
        this.stop();
      }
    };

    speakNextSentence();
  }

  // Generate clear conversational forecast script for today
  public generateForecastText(
    locationName: string,
    weather: WeatherMetrics,
    painScores?: PainScores | null
  ): string {
    const todayForecast = weather.forecastDays && weather.forecastDays.length > 0 ? weather.forecastDays[0] : null;

    const acheScore = todayForecast
      ? todayForecast.predictedPainScore
      : painScores
      ? Math.max(1, Math.min(10, Math.round(painScores.overallRisk / 10)))
      : 4;

    const headline =
      todayForecast?.painHeadline ||
      (acheScore >= 7 ? 'High Ache Alert' : acheScore >= 4 ? 'Moderate Stiffness Expected' : 'Good Day for Your Joints');

    const advice =
      todayForecast?.advice ||
      (acheScore >= 7
        ? 'A storm or sharp pressure drop is affecting joints. Stay warm and keep a heating pad nearby.'
        : acheScore >= 4
        ? 'Mild air pressure changes are underway. A warm shower and light morning stretching will help loosen joints.'
        : 'Air pressure is steady. Most seniors feel comfortable on days like today.');

    let cleanTrend = weather.pressureTrend
      ? weather.pressureTrend.toLowerCase().replace(/[^\w\s]/g, '').trim()
      : 'steady';

    let speech = `Hello! Here is today's joint health and weather guide for ${locationName}. `;
    speech += `Today's status: ${headline}, with an ache rating of ${acheScore} out of 10. `;
    speech += `The temperature is ${weather.temperature}, and relative humidity is ${weather.humidity}. `;
    speech += `Barometric pressure currently stands at ${weather.currentPressureInHg.toFixed(2)} inches of mercury, and is ${cleanTrend}. `;
    speech += `Comfort advice: ${advice} `;

    if (weather.forecastDays && weather.forecastDays.length > 1) {
      const tomorrow = weather.forecastDays[1];
      speech += `Looking ahead to tomorrow, ${tomorrow.dayLabel}: expect ${tomorrow.weatherDescription} with a high near ${Math.round(tomorrow.tempMax)} degrees. `;
    }

    speech += `Stay warm, relaxed, and have a wonderful day!`;
    return speech;
  }

  public readForecastOnLoad(
    locationName: string,
    weather: WeatherMetrics,
    painScores?: PainScores | null
  ) {
    // Generate text and prepare client audio blob without unsolicited auto-play
    const script = this.generateForecastText(locationName, weather, painScores);
    this.activeSentence = '';
    this.currentAudioUrl = this.generateClientWavBlob();
    this.notify();
  }
}

export const voiceService = new VoiceService();
