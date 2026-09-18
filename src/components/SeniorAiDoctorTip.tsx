import React, { useState } from 'react';
import { Sparkles, Coffee, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { PainLogEntry, WeatherMetrics, CorrelationAnalysisResponse } from '../types';

interface SeniorAiDoctorTipProps {
  logs: PainLogEntry[];
  weather: WeatherMetrics;
  isLargeText: boolean;
  onLogsUpdated: () => void;
}

export const SeniorAiDoctorTip: React.FC<SeniorAiDoctorTipProps> = ({
  logs,
  weather,
  isLargeText,
  onLogsUpdated,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<CorrelationAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetAdvice = async () => {
    if (logs.length < 3) {
      setError('Please log at least 3 daily check-ins using the section above so Dr. Weather Helper can compare your real symptoms with real weather changes.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/analyze-correlation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs, currentMetrics: weather }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate advice');
      }

      const data: CorrelationAnalysisResponse = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load advice right now. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-5 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
            <Coffee className="w-7 h-7" />
          </div>
          <div>
            <h3 className={`font-bold text-slate-900 ${isLargeText ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
              Daily Comfort Advice from Dr. Weather Helper
            </h3>
            <p className={`text-slate-600 font-medium ${isLargeText ? 'text-base' : 'text-sm'}`}>
              Personalized guidance comparing your recent check-ins against weather shifts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGetAdvice}
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-lg shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Sparkles className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Preparing Advice...' : 'Get Today\'s Advice'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
          <span className="font-medium text-base">{error}</span>
        </div>
      )}

      {analysis ? (
        <div className="bg-sky-50/70 border-2 border-sky-200 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
          <div>
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wide block mb-1">
              Personal Summary:
            </span>
            <p className={`font-semibold text-slate-900 leading-relaxed ${isLargeText ? 'text-xl' : 'text-lg'}`}>
              {analysis.summary}
            </p>
          </div>

          {analysis.primaryTriggers && analysis.primaryTriggers.length > 0 && (
            <div className="pt-2 border-t border-sky-200/80">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wide block mb-2">
                What Seems to Trigger Your Aches:
              </span>
              <div className="flex flex-wrap gap-2">
                {analysis.primaryTriggers.map((trig, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-slate-800 font-bold text-sm shadow-2xs"
                  >
                    🔍 {trig}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="pt-2 border-t border-sky-200/80">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wide block mb-2">
                Recommended Steps for Today:
              </span>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-slate-800 font-medium text-base"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-700 font-medium text-base leading-relaxed">
          <p>
            You currently have <strong>{logs.length} entries</strong> logged in your diary. Dr. Weather Helper will analyze your check-ins against live weather changes (like rain, cold drops, or wind) once you have logged at least 3 days in your daily diary!
          </p>
        </div>
      )}
    </div>
  );
};
