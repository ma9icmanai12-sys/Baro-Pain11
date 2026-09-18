import React from 'react';
import { Gauge, ArrowDown, ArrowUp, Minus, AlertTriangle } from 'lucide-react';

interface PressureCardProps {
  currentPressureInHg: number;
  change3Hour: number;
  pressureTrend: string;
  surfacePressureInHg?: number;
  elevationMeters?: number;
}

export const PressureCard: React.FC<PressureCardProps> = ({
  currentPressureInHg,
  change3Hour,
  pressureTrend,
  surfacePressureInHg,
  elevationMeters,
}) => {
  const hpa = Math.round(currentPressureInHg / 0.02953);
  const diffFromStandard = Number((currentPressureInHg - 29.92).toFixed(2));
  const isRapidDrop = change3Hour <= -0.06;
  const isRapidRise = change3Hour >= 0.06;

  // Percentage along visual meter (28.80 inHg = 0%, 30.60 inHg = 100%)
  const meterPercent = Math.max(0, Math.min(100, ((currentPressureInHg - 28.80) / (30.60 - 28.80)) * 100));

  return (
    <div className="relative rounded-2xl bg-[#040A18] border border-cyan-500/30 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Subtle background glow */}
      <div
        className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none ${
          isRapidDrop ? 'bg-rose-500/15' : 'bg-cyan-500/10'
        }`}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono tracking-wider text-cyan-400 uppercase">
              Atmospheric Pressure (MSL)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Continuous Live Barometer Feed
            </span>
          </div>
        </div>

        {/* Rapid Drop Alert Badge */}
        {isRapidDrop && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-[10px] font-mono font-bold text-rose-300 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            CYCLONIC DROP
          </span>
        )}
      </div>

      {/* Main Digital Readout */}
      <div className="my-2">
        <div className="flex items-baseline gap-2">
          <span className="font-orbitron font-extrabold text-3xl sm:text-4xl tracking-tight text-white">
            {currentPressureInHg.toFixed(2)}
          </span>
          <span className="font-mono text-base sm:text-lg text-cyan-300 font-medium">inHg</span>
          <span className="text-xs font-mono text-slate-400 ml-auto">({hpa} hPa MSL)</span>
        </div>
        {surfacePressureInHg && (
          <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-2">
            <span>Local Ground Station Surface Pressure:</span>
            <span className="text-cyan-300 font-bold">{surfacePressureInHg.toFixed(2)} inHg</span>
            {elevationMeters !== undefined && (
              <span className="text-slate-500">(@ {elevationMeters}m elevation)</span>
            )}
          </div>
        )}
      </div>

      {/* Trend & 3-Hour Delta */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80">
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase">3-Hour Barometric Delta</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {change3Hour < -0.01 ? (
              <span className="inline-flex items-center text-xs font-mono font-semibold text-rose-400">
                <ArrowDown className="w-3.5 h-3.5" />
                {change3Hour > 0 ? `+${change3Hour.toFixed(2)}` : `${change3Hour.toFixed(2)}`} inHg
              </span>
            ) : change3Hour > 0.01 ? (
              <span className="inline-flex items-center text-xs font-mono font-semibold text-emerald-400">
                <ArrowUp className="w-3.5 h-3.5" />
                +{change3Hour.toFixed(2)} inHg
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-mono font-semibold text-slate-300">
                <Minus className="w-3.5 h-3.5" />
                0.00 inHg
              </span>
            )}
          </div>
        </div>

        {/* Pressure Trend Label */}
        <div className="text-right">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Dynamic Trend</div>
          <div
            className={`text-xs font-orbitron font-bold tracking-wider mt-0.5 ${
              isRapidDrop
                ? 'text-rose-400'
                : isRapidRise
                ? 'text-emerald-400'
                : change3Hour < 0
                ? 'text-amber-400'
                : 'text-cyan-300'
            }`}
          >
            {pressureTrend}
          </div>
        </div>
      </div>

      {/* Pressure Spectrum Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
          <span>Low &lt;29.4</span>
          <span className="text-cyan-400/80">Std 29.92</span>
          <span>High &gt;30.4</span>
        </div>
        <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          {/* Gradient zones: Low (Storm) -> Normal -> High Ridge */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-600 via-cyan-500 to-blue-500 opacity-60" />
          {/* Indicator pin */}
          <div
            className="absolute top-0 bottom-0 w-2 -ml-1 bg-white rounded-full shadow-[0_0_8px_#ffffff]"
            style={{ left: `${meterPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
          <span>
            {diffFromStandard < 0
              ? `${Math.abs(diffFromStandard).toFixed(2)} inHg below standard`
              : `${diffFromStandard.toFixed(2)} inHg above standard`}
          </span>
          <span className={currentPressureInHg < 29.80 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
            {currentPressureInHg < 29.80 ? '⚠️ Pain Trigger Zone' : 'Equilibrium Zone'}
          </span>
        </div>
      </div>
    </div>
  );
};
