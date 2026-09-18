import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Play,
  Square,
  Gauge,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { voiceService, VoiceState } from '../services/voiceService';

interface VoiceAutoReadBannerProps {
  isSpeaking: boolean;
  onPlayForecast: () => void;
  onStopForecast: () => void;
  locationName: string;
  audioUrl?: string | null;
  forecastScript?: string;
}

export const VoiceAutoReadBanner: React.FC<VoiceAutoReadBannerProps> = ({
  isSpeaking,
  onPlayForecast,
  onStopForecast,
  locationName,
  audioUrl,
  forecastScript = '',
}) => {
  const [activeSentence, setActiveSentence] = useState<string>('');
  const [rate, setRate] = useState<number>(0.9);
  const [volume, setVolume] = useState<number>(1.0);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [showAudioControls, setShowAudioControls] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Subscribe to real-time voice updates
  useEffect(() => {
    const unsub = voiceService.subscribe((state: VoiceState) => {
      setActiveSentence(state.activeSentence);
      setRate(state.rate);
      setVolume(state.volume);
    });
    return () => {
      unsub();
    };
  }, []);

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    voiceService.setRate(newRate);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    voiceService.setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  return (
    <div
      id="voice-autoread-banner"
      className="mb-6 rounded-3xl p-4 sm:p-6 border-2 shadow-sm transition-all bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-emerald-300"
    >
      {/* Top Row: Title, Location, and Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-emerald-200/70">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all ${
              isSpeaking
                ? 'bg-amber-500 text-white ring-4 ring-amber-200 animate-pulse'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-600/15 text-emerald-900 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                Spoken Voice Forecast
              </span>
              <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                📍 {locationName}
              </span>
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {isSpeaking ? (
                <span className="text-amber-900 font-extrabold flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  Reading aloud today's weather & joint comfort forecast...
                </span>
              ) : (
                <span>Listen to today's barometric pressure & arthritis forecast read aloud</span>
              )}
            </p>
          </div>
        </div>

        {/* Big Action Buttons */}
        <div className="w-full md:w-auto md:min-w-[280px] md:max-w-[420px]">
          {isSpeaking ? (
            <button
              id="btn-banner-stop-voice"
              onClick={onStopForecast}
              className="w-full min-w-0 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border-2 border-amber-400"
            >
              <Square className="w-5 h-5 fill-white" />
              <span className="truncate">Stop Audio</span>
            </button>
          ) : (
            <button
              id="btn-banner-play-voice"
              onClick={onPlayForecast}
              className="w-full min-w-0 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 border-2 border-emerald-500"
            >
              <Play className="w-5 h-5 fill-white" />
              <span className="truncate">🔊 Talk Daily Forecast</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <button
          id="btn-toggle-audio-controls"
          type="button"
          onClick={() => setShowAudioControls((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-emerald-200 text-emerald-900 font-bold text-sm shadow-xs"
        >
          <Volume2 className="w-4 h-4 text-emerald-600" />
          <span>{showAudioControls ? 'Hide audio controls' : 'Show audio controls'}</span>
          {showAudioControls ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAudioControls && (
          <div className="mt-3 pt-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white/80 p-3 sm:p-4 rounded-2xl border border-emerald-200/90 shadow-2xs">
            {/* Native HTML5 Audio Controller Widget */}
            <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                Audio Bar:
              </span>
              <audio
                id="forecast-audio-player"
                ref={audioRef}
                controls
                src={audioUrl || voiceService.generateClientWavBlob()}
                className="w-full h-10 accent-emerald-600 rounded-lg"
                onPlay={() => {
                  if (!isSpeaking) onPlayForecast();
                }}
                onPause={() => {
                  if (isSpeaking) onStopForecast();
                }}
              />
            </div>

            {/* Speed & Volume Sliders for Seniors */}
            <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap justify-between sm:justify-end shrink-0 text-sm">
              {/* Speed Presets */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <Gauge className="w-4 h-4 text-slate-500 ml-1.5" />
                <button
                  id="btn-voice-speed-slow"
                  onClick={() => handleRateChange(0.8)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    rate <= 0.85
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  0.8x Slower
                </button>
                <button
                  id="btn-voice-speed-normal"
                  onClick={() => handleRateChange(1.0)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    rate > 0.85
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1.0x Normal
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                )}
                <input
                  id="voice-volume-slider"
                  aria-label="Spoken audio volume slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1.5 accent-emerald-600 bg-slate-300 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-600 w-8 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Transcript Toggle Button */}
              <button
                id="btn-toggle-transcript"
                onClick={() => setShowTranscript(!showTranscript)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Transcript</span>
                {showTranscript ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Spoken Sentence Highlight Banner */}
      {isSpeaking && activeSentence && (
        <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-amber-100/90 border-2 border-amber-300 shadow-2xs animate-fadeIn flex items-start gap-3">
          <span className="text-xl shrink-0">💬</span>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 block mb-0.5">
              Currently Speaking:
            </span>
            <p className="text-base sm:text-lg font-bold text-amber-950 leading-snug">
              "{activeSentence}"
            </p>
          </div>
        </div>
      )}

      {/* Spoken Text Transcript (Collapsible) */}
      {showTranscript && (
        <div className="mt-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            Full Spoken Forecast Script
          </h4>
          <p className="text-base font-medium text-slate-800 leading-relaxed">
            {forecastScript ||
              "Hello! Here is today's joint health and weather guide. Barometric pressure and arthritis stiffness risk are calculated in real-time."}
          </p>
        </div>
      )}
    </div>
  );
};
