import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface RiskGaugeProps {
  riskScore: number; // 0 - 100
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ riskScore }) => {
  // Clamped 0-100
  const clampedRisk = Math.max(0, Math.min(100, Math.round(riskScore)));

  // Determine severity tier
  let tier = 'LOW RISK';
  let tierColor = 'text-emerald-400';
  let tierStroke = '#10b981';
  let tierBg = 'bg-emerald-500/10 border-emerald-500/30';
  let advisory = 'Weather conditions are stable. Low likelihood of atmospheric-induced pain flares.';

  if (clampedRisk > 70) {
    tier = 'SEVERE FLARE RISK';
    tierColor = 'text-rose-400';
    tierStroke = '#f43f5e';
    tierBg = 'bg-rose-500/15 border-rose-500/40';
    advisory = 'High atmospheric stress. Heightened susceptibility to joint expansion and barometric migraines.';
  } else if (clampedRisk > 50) {
    tier = 'ELEVATED RISK';
    tierColor = 'text-amber-400';
    tierStroke = '#f59e0b';
    tierBg = 'bg-amber-500/10 border-amber-500/30';
    advisory = 'Noticeable barometric fluctuation detected. Consider pre-emptive hydration and joint warmth.';
  } else if (clampedRisk > 30) {
    tier = 'MODERATE RISK';
    tierColor = 'text-cyan-400';
    tierStroke = '#06b6d4';
    tierBg = 'bg-cyan-500/10 border-cyan-500/30';
    advisory = 'Mild pressure or humidity variations present. Sensitive individuals may feel slight joint stiffness.';
  }

  // SVG circular arc math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedRisk / 100) * circumference;

  return (
    <div className="relative rounded-2xl bg-[#040A18] border border-cyan-500/30 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono tracking-wider text-cyan-400 uppercase">
              Composite Risk Index
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Weighted Meteorological Vulnerability</span>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-orbitron font-semibold ${tierBg} ${tierColor}`}>
          {tier}
        </span>
      </div>

      {/* Circular Gauge Presentation */}
      <div className="flex items-center justify-center py-3">
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* SVG Ring */}
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Track */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="#0f172a"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Ambient subtle outline */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke="#1e293b"
              strokeWidth="2"
              fill="transparent"
              strokeDasharray="4 4"
            />
            {/* Dynamic Value Arc */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              stroke={tierStroke}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
              style={{
                filter: `drop-shadow(0 0 8px ${tierStroke}80)`,
              }}
            />
          </svg>

          {/* Central Numeric Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-orbitron font-extrabold text-3xl text-white tracking-tight">
              {clampedRisk}
              <span className="text-lg font-mono text-cyan-300 font-normal">%</span>
            </span>
            <span className="text-[9px] font-mono tracking-wider uppercase text-slate-400 mt-0.5">
              PAIN THREAT
            </span>
          </div>
        </div>
      </div>

      {/* Advisory & Formula Note */}
      <div className="pt-2 border-t border-slate-800/80">
        <p className="text-xs text-slate-300 leading-relaxed font-mono flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>{advisory}</span>
        </p>
        <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
          Formula: <code className="text-cyan-400/90">[(Head + Joint + Back) / 3] × 10</code>
        </div>
      </div>
    </div>
  );
};
