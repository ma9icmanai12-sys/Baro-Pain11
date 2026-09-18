import React from 'react';
import { Gauge, HelpCircle, ArrowDown, ArrowUp, Minus, Info } from 'lucide-react';
import { WeatherMetrics } from '../types';

interface SeniorBarometerExplainerProps {
  weather: WeatherMetrics;
  isLargeText: boolean;
}

export const SeniorBarometerExplainer: React.FC<SeniorBarometerExplainerProps> = ({
  weather,
  isLargeText,
}) => {
  const pressure = weather.currentPressureInHg;
  const trend = weather.pressureTrend;

  // Evaluate position on standard 29.50 to 30.50 scale
  const minVal = 29.50;
  const maxVal = 30.50;
  const clamped = Math.max(minVal, Math.min(maxVal, pressure));
  const percent = ((clamped - minVal) / (maxVal - minVal)) * 100;

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-5 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h3 className={`font-bold text-slate-900 ${isLargeText ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
            Understanding The Barometer Today
          </h3>
          <p className={`text-slate-600 font-medium ${isLargeText ? 'text-lg' : 'text-base'}`}>
            Why air pressure affects how your joints feel
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm font-bold">
          <Gauge className="w-4 h-4 text-indigo-600" />
          <span>Barometer: {pressure.toFixed(2)} inHg</span>
        </div>
      </div>

      {/* Visual Barometer Gauge */}
      <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-600">Low Pressure (Storms & Rain)</span>
          <span className="text-sm font-bold text-slate-800">Normal (30.00 inHg)</span>
          <span className="text-sm font-bold text-slate-600">High Pressure (Clear Skies)</span>
        </div>

        {/* Gauge Track */}
        <div className="relative w-full h-5 bg-gradient-to-r from-rose-200 via-emerald-200 to-sky-200 rounded-full border border-slate-300">
          {/* Current Needle Pin */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-slate-900 border-2 border-white rounded-full shadow-md flex items-center justify-center transition-all duration-500"
            style={{ left: `${percent}%` }}
            title={`Current: ${pressure.toFixed(2)} inHg`}
          >
            <div className="w-2 h-2 bg-sky-400 rounded-full" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>29.50 inHg</span>
          <span className="text-slate-900 font-bold text-sm">
            Current: <strong>{pressure.toFixed(2)} inHg</strong> ({trend})
          </span>
          <span>30.50 inHg</span>
        </div>
      </div>

      {/* Everyday Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        <div className="bg-amber-50/70 border-2 border-amber-200/80 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-lg">
            <HelpCircle className="w-6 h-6 text-amber-600" />
            <span>Why do my joints ache when it rains?</span>
          </div>
          <p className={`text-slate-800 font-medium leading-relaxed ${isLargeText ? 'text-lg' : 'text-base'}`}>
            Think of the air as a gentle, invisible blanket holding your body together. When a storm arrives, the weight of the air drops. This drop in external pressure allows tissues and fluids inside your joints to expand slightly, which puts pressure on sensitive nerves.
          </p>
        </div>

        <div className="bg-sky-50/70 border-2 border-sky-200/80 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-sky-900 font-bold text-lg">
            <Info className="w-6 h-6 text-sky-600" />
            <span>Simple everyday ways to protect your joints</span>
          </div>
          <ul className={`text-slate-800 font-medium space-y-1.5 list-disc list-inside leading-relaxed ${isLargeText ? 'text-lg' : 'text-base'}`}>
            <li><strong>Stay warm:</strong> Wear a cozy sweater or long pants when pressure drops.</li>
            <li><strong>Keep moving gently:</strong> Light arm and leg movements keep fluid circulating.</li>
            <li><strong>Warm soaks:</strong> A warm bath, shower, or heating pad helps ease stiff muscles.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
