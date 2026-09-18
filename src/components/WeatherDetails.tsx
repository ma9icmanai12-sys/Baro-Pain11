import React from 'react';
import { Droplets, Thermometer, Wind, CloudRain, Sun, Compass } from 'lucide-react';
import { WeatherMetrics } from '../types';

interface WeatherDetailsProps {
  weather: WeatherMetrics;
}

export const WeatherDetails: React.FC<WeatherDetailsProps> = ({ weather }) => {
  const cleanHum = parseFloat(weather.humidity.replace('%', '')) || 50;
  const cleanTemp = parseFloat(weather.temperature.replace('°F', '')) || 70;
  const cleanWind = parseFloat(weather.windSpeed.replace(' mph', '')) || 10;

  // Approximate dew point using Magnus-Tetens approximation
  const dewPointF = Math.round(
    cleanTemp - ((100 - cleanHum) / 5)
  );

  return (
    <div className="rounded-2xl bg-[#040A18] border border-cyan-500/30 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
          <CloudRain className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-orbitron font-bold tracking-wider text-cyan-400 uppercase">
            Ambient Meteorological Telemetry
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            Ground-level biomechanical triggers
          </span>
        </div>
      </div>

      {/* 3 Main Tiles: Humidity, Temperature, Wind Speed */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Humidity */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Relative Humidity</span>
            <Droplets className="w-4 h-4 text-sky-400" />
          </div>
          <div className="my-2">
            <div className="font-orbitron font-extrabold text-2xl text-white">
              {weather.humidity}
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Dew Point ~ {dewPointF}°F
            </span>
          </div>
          <div className="text-[10px] font-mono pt-1.5 border-t border-slate-800/80">
            {cleanHum > 70 ? (
              <span className="text-amber-400">⚠️ High humidity amplifies joint swelling</span>
            ) : (
              <span className="text-emerald-400">Optimal articular moisture</span>
            )}
          </div>
        </div>

        {/* Temperature */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Surface Temperature</span>
            <Thermometer className="w-4 h-4 text-orange-400" />
          </div>
          <div className="my-2">
            <div className="font-orbitron font-extrabold text-2xl text-white">
              {weather.temperature}
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Standard Baseline: 70°F
            </span>
          </div>
          <div className="text-[10px] font-mono pt-1.5 border-t border-slate-800/80">
            {cleanTemp < 65 ? (
              <span className="text-cyan-300">❄️ Sub-65°F induces myofascial shivering</span>
            ) : (
              <span className="text-emerald-400">Within comfortable thermal zone</span>
            )}
          </div>
        </div>

        {/* Wind Speed */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Wind Velocity</span>
            <Wind className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-2">
            <div className="font-orbitron font-extrabold text-2xl text-white">
              {weather.windSpeed}
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Core buffeting threshold: 15 mph
            </span>
          </div>
          <div className="text-[10px] font-mono pt-1.5 border-t border-slate-800/80">
            {cleanWind > 15 ? (
              <span className="text-amber-400">🌬️ Wind chill promotes lumbar bracing</span>
            ) : (
              <span className="text-emerald-400">Gentle breeze; low spine strain</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
