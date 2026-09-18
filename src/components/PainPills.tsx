import React, { useState } from 'react';
import { PainScores } from '../types';
import { PainCalculator } from '../services';
import { ChevronDown, ChevronUp, Brain, Bone, Activity, Sparkles } from 'lucide-react';

interface PainPillsProps {
  scores: PainScores;
}

export const PainPills: React.FC<PainPillsProps> = ({ scores }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const categories = [
    {
      id: 'HEADACHE',
      label: 'HEADACHE / MIGRAINE',
      icon: Brain,
      score: scores.HEADACHE,
      formula: '[|ΔP₃ₕ| × 35 × 0.70] + [|70 - Temp| / 25 × 10 × 0.30]',
      primaryFactor: `Pressure Flux: +${scores.breakdown.headacheTrendComponent} pts | Thermal Stress: +${scores.breakdown.headacheTempComponent} pts`,
      mechanism:
        'Rapid barometric drops alter cranial vascular tone and expand sinus cavities. Deviations from 70°F induce involuntary autonomic vasospasm.',
      prevention: 'Hydrate early with electrolytes. Apply cold compress to temples and rest in dark room if pressure falls rapidly.',
    },
    {
      id: 'JOINT_PAIN',
      label: 'JOINT & ARTHRITIS',
      icon: Bone,
      score: scores.JOINT_PAIN,
      formula: '[(30.20 - P) × 12 × 0.60] + [Humidity / 100 × 10 × 0.40]',
      primaryFactor: `Low Barometer: +${scores.breakdown.jointPressureComponent} pts | High Humidity: +${scores.breakdown.jointHumidityComponent} pts`,
      mechanism:
        'When atmospheric pressure drops below 30.20 inHg, ambient resistance decreases, allowing inflamed joint capsules and synovial fluids to expand against sensitive nerves.',
      prevention: 'Keep joints insulated and warm. Light low-impact movement or warm Epsom salt baths relieve intra-articular pressure.',
    },
    {
      id: 'BACK_PAIN',
      label: 'BACK & LUMBAR',
      icon: Activity,
      score: scores.BACK_PAIN,
      formula: '[Wind / 35 × 10 × 0.50] + [(65 - Temp) / 40 × 10 × 0.50]',
      primaryFactor: `Wind Gusts: +${scores.breakdown.backWindComponent} pts | Sub-65°F Cold: +${scores.breakdown.backTempComponent} pts`,
      mechanism:
        'Wind shear buffeting combined with temperatures dropping below 65°F triggers involuntary micro-shivering, paraspinal contraction, and fascial stiffness.',
      prevention: 'Wear a wind-resistant core layer. Apply a lumbar heating pad and perform gentle cat-cow spinal mobility stretches.',
    },
    {
      id: 'NECK_PAIN',
      label: 'NECK & CERVICAL',
      icon: Sparkles,
      score: scores.NECK_PAIN,
      formula: '(Back Pain - 1).clamp(1, 10)',
      primaryFactor: `Cervicothoracic kinetic chain linkage (Score: ${scores.NECK_PAIN}/10)`,
      mechanism:
        'Biomechanical tension along the upper trapezius and levator scapulae mirrors paraspinal lumbar tightness during cold drafts.',
      prevention: 'Keep neck wrapped with a scarf in windy drafts. Perform gentle cervical chin tucks and shoulder blade pinches.',
    },
  ];

  return (
    <div className="rounded-2xl bg-[#040A18] border border-cyan-500/30 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-mono tracking-wider text-cyan-400 uppercase">
            Granular Clinical Pain Indices
          </h3>
          <p className="text-[10px] text-slate-400 font-mono">
            Derived from barometric flux, ambient humidity, temperature delta & wind speed
          </p>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Scale: 1 (Mild) – 10 (Severe)</span>
      </div>

      {/* Grid of the 4 Pain Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const severity = PainCalculator.getSeverityLabel(cat.score);
          const isExpanded = expandedId === cat.id;

          return (
            <div
              key={cat.id}
              className={`rounded-xl border transition-all duration-200 bg-slate-950/60 ${
                isExpanded ? 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-slate-800 hover:border-slate-700'
              } p-3.5 flex flex-col justify-between`}
            >
              <div>
                {/* Header with Icon & Score */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-orbitron font-bold text-slate-200 tracking-wide">
                      {cat.label}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${severity.bg} ${severity.color}`}
                  >
                    {cat.score}/10
                  </span>
                </div>

                {/* Visual Segments (10 blocks) */}
                <div className="grid grid-cols-10 gap-0.5 my-2">
                  {Array.from({ length: 10 }, (_, i) => {
                    const blockIndex = i + 1;
                    const isActive = blockIndex <= cat.score;
                    let blockColor = 'bg-slate-800';
                    if (isActive) {
                      if (cat.score <= 3) blockColor = 'bg-emerald-400';
                      else if (cat.score <= 5) blockColor = 'bg-cyan-400';
                      else if (cat.score <= 7) blockColor = 'bg-amber-400';
                      else blockColor = 'bg-rose-500 shadow-[0_0_6px_#f43f5e]';
                    }
                    return (
                      <div
                        key={i}
                        className={`h-2 rounded-[1px] transition-all duration-300 ${blockColor}`}
                      />
                    );
                  })}
                </div>

                {/* Sub-label */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>Vulnerability:</span>
                  <span className={`font-semibold ${severity.color}`}>{severity.label}</span>
                </div>
              </div>

              {/* Expansion Trigger */}
              <button
                onClick={() => toggleExpand(cat.id)}
                className="mt-3 pt-2 border-t border-slate-800/80 w-full flex items-center justify-between text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>{isExpanded ? 'Hide Bio-Analysis' : 'Clinical Bio-Analysis'}</span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {/* Expanded Clinical Breakdown */}
              {isExpanded && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] font-mono space-y-2 text-slate-300 animate-in fade-in duration-200">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Formula Contributors:</div>
                    <div className="text-cyan-300 text-[10px] font-semibold">{cat.primaryFactor}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Physiological Mechanism:</div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">{cat.mechanism}</p>
                  </div>
                  <div className="p-2 rounded bg-cyan-950/40 border border-cyan-500/20 text-[10px] text-cyan-200">
                    <span className="font-bold text-cyan-400">Action: </span>
                    {cat.prevention}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    Model: <code className="text-slate-400">{cat.formula}</code>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
