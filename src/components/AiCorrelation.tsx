import React, { useState } from 'react';
import { Sparkles, Bot, AlertCircle, CheckCircle2, ShieldCheck, ThermometerSnowflake } from 'lucide-react';
import { PainLogEntry, WeatherMetrics, CorrelationAnalysisResponse } from '../types';

interface AiCorrelationProps {
  logs: PainLogEntry[];
  weather: WeatherMetrics;
}

export const AiCorrelation: React.FC<AiCorrelationProps> = ({ logs, weather }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<CorrelationAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAi = async () => {
    if (logs.length < 3) {
      setError('Log at least 3 daily entries first to enable statistically meaningful AI correlation.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/analyze-correlation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs,
          currentMetrics: weather,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze correlations');
      }

      const data: CorrelationAnalysisResponse = await response.json();
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to AI correlation service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#040A18] border border-cyan-500/30 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xs font-orbitron font-bold tracking-wider text-cyan-400 uppercase">
                AI Weather-Pain Correlation
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Powered by Gemini • Bio-Statistical Pattern Detection
              </span>
            </div>
          </div>

          <button
            onClick={handleRunAi}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-orbitron font-bold text-xs tracking-wider transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-50"
          >
            <Bot className={`w-4 h-4 ${loading ? 'animate-bounce' : ''}`} />
            <span>{loading ? 'ANALYZING...' : 'RUN AI ANALYSIS'}</span>
          </button>
        </div>

        {/* Informational Subtext */}
        <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
          Compares your {logs.length} logged symptom entries against historic barometric pressure drops,
          humidity, and wind buffeting to identify personal flare triggers.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Container */}
        {analysis ? (
          <div className="space-y-3 bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 animate-in fade-in duration-300">
            {/* Sensitivity Badge */}
            {analysis.sensitivityLevel && (
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  Identified Barometric Sensitivity:
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-orbitron font-bold text-[10px]">
                  {analysis.sensitivityLevel.toUpperCase()} SENSITIVITY
                </span>
              </div>
            )}

            {/* Empathetic Summary */}
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                Empathetic Clinical Synthesis:
              </div>
              <p className="text-xs text-slate-100 font-mono leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                "{analysis.summary}"
              </p>
            </div>

            {/* Triggers */}
            {analysis.primaryTriggers && analysis.primaryTriggers.length > 0 && (
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-1.5">
                  Detected Atmospheric Triggers:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.primaryTriggers.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-rose-950/50 border border-rose-500/30 text-rose-300 text-[11px] font-mono flex items-center gap-1"
                    >
                      <ThermometerSnowflake className="w-3 h-3 text-rose-400" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preventive Action Steps */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Personalized Preventative Protocol:
                </div>
                <ul className="space-y-1 text-xs font-mono text-cyan-200/90">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-center">
            <Bot className="w-8 h-8 text-cyan-500/40 mx-auto mb-2 animate-pulse" />
            <div className="text-xs font-mono text-slate-400">
              Awaiting trigger scan. Click <span className="text-cyan-300 font-semibold">RUN AI ANALYSIS</span> above to run Gemini neural synthesis on your logged pain vs atmospheric pressure records.
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-cyan-400" /> Server-side secure inference
        </span>
        <span>Model: gemini-3.8-flash</span>
      </div>
    </div>
  );
};
