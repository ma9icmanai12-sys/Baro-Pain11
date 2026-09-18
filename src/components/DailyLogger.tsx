import React, { useState } from 'react';
import { Save, CheckCircle, Plus, FileText } from 'lucide-react';
import { DbHelper } from '../services/dbHelper';
import { WeatherMetrics } from '../types';

interface DailyLoggerProps {
  weather: WeatherMetrics;
  onLogSaved: () => void;
}

const PAIN_DESCRIPTORS: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: 'Sub-Clinical', desc: 'No perceptible discomfort; joints loose, sinus clear.', color: 'text-emerald-400' },
  2: { label: 'Minimal', desc: 'Faint awareness of joints or neck, zero functional impact.', color: 'text-emerald-400' },
  3: { label: 'Mild', desc: 'Minor stiffness or dull sinus pressure; easily ignored.', color: 'text-cyan-400' },
  4: { label: 'Noticeable', desc: 'Localized twinges in back or knees; movements feel heavier.', color: 'text-cyan-400' },
  5: { label: 'Distracting', desc: 'Persistent ache; requires minor ergonomic adjustments.', color: 'text-yellow-400' },
  6: { label: 'Moderate', desc: 'Noticeable headache or joint ache; affects work concentration.', color: 'text-yellow-400' },
  7: { label: 'Elevated', desc: 'Sharp throbbing or intense stiffness; daily tasks compromised.', color: 'text-amber-500' },
  8: { label: 'Severe', desc: 'Pronounced flaring; lying down required, anti-inflammatory taken.', color: 'text-rose-400' },
  9: { label: 'Intense', desc: 'Debilitating migraine or acute spine spasm; acute distress.', color: 'text-rose-500' },
  10: { label: 'Incapacitating', desc: 'Maximum severity; bedridden, severe photophobia or joint lock.', color: 'text-red-500' },
};

export const DailyLogger: React.FC<DailyLoggerProps> = ({
  weather,
  onLogSaved,
}) => {
  const [score, setScore] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const cleanHumidity = parseFloat(weather.humidity.replace('%', '')) || 50;
  const cleanWind = parseFloat(weather.windSpeed.replace(' mph', '')) || 10;
  const cleanTemp = parseFloat(weather.temperature.replace('°F', '')) || 68;

  const handleSave = () => {
    DbHelper.logDailyPain({
      score,
      pressure: weather.currentPressureInHg,
      humidity: cleanHumidity,
      wind: cleanWind,
      temperature: cleanTemp,
      notes: notes.trim(),
    });

    setIsSaved(true);
    onLogSaved();
    setTimeout(() => setIsSaved(false), 2500);
  };

  const descriptor = PAIN_DESCRIPTORS[score] || PAIN_DESCRIPTORS[5];

  return (
    <div className="rounded-2xl bg-[#040A18] border border-cyan-500/30 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-orbitron font-bold tracking-wider text-cyan-400 uppercase">
              Daily Pain Telemetry Logger
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Captures clinical score correlated with current barometric matrix
            </span>
          </div>
        </div>
      </div>

      {/* Main Slider Area */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 my-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-300">Your Current Perceived Pain Level:</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-orbitron text-2xl font-extrabold ${descriptor.color}`}>
              {score}
            </span>
            <span className="text-xs font-mono text-slate-500">/ 10</span>
          </div>
        </div>

        {/* Range Slider */}
        <input
          id="perceived-pain-slider"
          aria-label="Your Current Perceived Pain Level"
          type="range"
          min="1"
          max="10"
          step="1"
          value={score}
          onChange={(e) => setScore(parseInt(e.target.value, 10))}
          className="w-full h-2.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
        />

        {/* 1-10 Tick Selector buttons */}
        <div className="flex justify-between items-center mt-2 px-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
            <button
              key={val}
              onClick={() => setScore(val)}
              className={`w-6 h-6 rounded text-xs font-mono font-semibold transition-all ${
                score === val
                  ? 'bg-cyan-500 text-slate-950 scale-110 shadow-[0_0_8px_#06b6d4]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Qualitative Descriptor box */}
        <div className="mt-3.5 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div>
            <span className={`font-bold ${descriptor.color}`}>{descriptor.label}: </span>
            <span className="text-slate-300">{descriptor.desc}</span>
          </div>
        </div>
      </div>

      {/* Weather Snapshot to be logged */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono my-3">
        <div className="p-2 rounded bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Stamp Pressure:</span>
          <span className="text-cyan-300 font-bold">{weather.currentPressureInHg.toFixed(2)} inHg</span>
        </div>
        <div className="p-2 rounded bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Stamp Humidity:</span>
          <span className="text-cyan-300 font-bold">{weather.humidity}</span>
        </div>
        <div className="p-2 rounded bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Stamp Wind:</span>
          <span className="text-cyan-300 font-bold">{weather.windSpeed}</span>
        </div>
        <div className="p-2 rounded bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-500 block">Stamp Temp:</span>
          <span className="text-cyan-300 font-bold">{weather.temperature}</span>
        </div>
      </div>

      {/* Optional Note input & Save button */}
      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        <input
          id="clinical-notes-input"
          aria-label="Optional clinical notes"
          type="text"
          placeholder="Optional clinical notes (e.g. throbbing frontal sinus, swollen fingers)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
        />

        <button
          onClick={handleSave}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-orbitron font-bold text-xs tracking-wider transition-all shadow-lg ${
            isSaved
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_#10b981]'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
          }`}
        >
          {isSaved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>SAVED TO MATRIX!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>LOG DAILY PAIN</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
