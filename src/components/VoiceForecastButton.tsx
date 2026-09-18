import React from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

interface VoiceForecastButtonProps {
  onSpeak: () => void;
  isSpeaking: boolean;
  compact?: boolean;
  className?: string;
}

export const VoiceForecastButton: React.FC<VoiceForecastButtonProps> = ({
  onSpeak,
  isSpeaking,
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <button
        id="btn-voice-forecast-compact"
        onClick={onSpeak}
        title={isSpeaking ? 'Stop reading forecast' : 'Read today\'s pain forecast aloud'}
        aria-label={isSpeaking ? 'Stop reading forecast' : 'Read today\'s pain forecast aloud'}
        className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-sm cursor-pointer ${
          isSpeaking
            ? 'bg-amber-500 text-white animate-pulse border-2 border-amber-300'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-500 active:scale-95'
        } ${className}`}
      >
        {isSpeaking ? (
          <>
            <VolumeX className="w-4 h-4 text-white shrink-0" />
            <span>Stop Voice</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 text-white shrink-0" />
            <span>Read Forecast</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      id="btn-voice-forecast-main"
      onClick={onSpeak}
      title={isSpeaking ? 'Stop speaking forecast' : 'Read today\'s pain forecast out loud'}
      aria-label={isSpeaking ? 'Stop speaking forecast' : 'Read today\'s pain forecast out loud'}
      className={`group relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-200 shadow-md cursor-pointer border-2 ${
        isSpeaking
          ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-300 ring-4 ring-amber-200 animate-pulse'
          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 hover:shadow-lg active:scale-98'
      } ${className}`}
    >
      <div className="p-2 rounded-xl bg-white/20 shrink-0">
        {isSpeaking ? (
          <VolumeX className="w-6 h-6 text-white" />
        ) : (
          <Volume2 className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        )}
      </div>

      <div className="flex flex-col text-left leading-tight">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          {isSpeaking ? 'Speaking Out Loud' : 'Voice Forecast'}
        </span>
        <span className="text-base sm:text-lg font-extrabold text-white">
          {isSpeaking ? 'Tap to Stop Reading' : '🔊 Talk Today\'s Pain Forecast'}
        </span>
      </div>

      {isSpeaking && (
        <span className="flex h-3 w-3 relative ml-auto">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
      )}
    </button>
  );
};
