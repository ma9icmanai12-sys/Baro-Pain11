import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart3, Wind, Droplets, Mountain, Gauge } from 'lucide-react';
import { WeatherMetrics } from '../types';
import { PressureChart } from './PressureChart';

interface SeniorAdvancedSectionProps {
  weather: WeatherMetrics;
  isLargeText: boolean;
}

export const SeniorAdvancedSection: React.FC<SeniorAdvancedSectionProps> = ({
  weather,
  isLargeText,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const elevationFt = weather.elevationMeters
    ? Math.round(weather.elevationMeters * 3.28084)
    : null;

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-5 sm:p-7 space-y-4">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h4 className={`font-bold text-slate-900 ${isLargeText ? 'text-xl sm:text-2xl' : 'text-lg'}`}>
              Detailed 24-Hour Barometer Graph & Advanced Numbers
            </h4>
            <p className="text-sm font-medium text-slate-500">
              Optional technical graph for family, doctors, or weather hobbyists
            </p>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-white border border-slate-300 text-slate-700">
          {isOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="pt-3 space-y-5 animate-in fade-in duration-200">
          {/* 24-Hour Pressure Chart */}
          <div className="bg-slate-900 rounded-2xl p-4 text-white">
            <h5 className="text-sm font-bold text-sky-400 mb-2">
              Continuous 24-Hour Barometer History ({weather.locationName}):
            </h5>
            <PressureChart
              data={weather.past24HoursPressure}
              timestamps={weather.hourlyTimestamps}
              currentTrend={weather.pressureTrend}
            />
          </div>

          {/* Additional Meteorological Stations telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-xs font-bold text-slate-500 uppercase block">3-Hour Pressure Rate</span>
              <strong className="text-base text-slate-900 font-bold">
                {weather.change3Hour > 0 ? `+${weather.change3Hour.toFixed(3)}` : weather.change3Hour.toFixed(3)} inHg
              </strong>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-xs font-bold text-slate-500 uppercase block">Surface Pressure</span>
              <strong className="text-base text-slate-900 font-bold">
                {weather.surfacePressureInHg?.toFixed(2) || weather.currentPressureInHg.toFixed(2)} inHg
              </strong>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-xs font-bold text-slate-500 uppercase block">Ground Elevation</span>
              <strong className="text-base text-slate-900 font-bold">
                {elevationFt ? `${elevationFt} feet` : 'Sea Level'}
              </strong>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <span className="text-xs font-bold text-slate-500 uppercase block">Source Network</span>
              <strong className="text-base text-slate-900 font-bold">
                Open-Meteo WMO
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
