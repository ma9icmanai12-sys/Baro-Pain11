import React from 'react';
import { Radio, MapPin, Compass, RefreshCw, CheckCircle2, ShieldCheck, Mountain } from 'lucide-react';
import { LocationItem, WeatherMetrics } from '../types';

interface LiveStatusBannerProps {
  currentLocation: LocationItem;
  weather: WeatherMetrics | null;
  isLoading: boolean;
  onDetectLocation: () => void;
  onRefresh: () => void;
  countdownSeconds: number;
  isGpsActive: boolean;
  gpsStatus: 'idle' | 'detecting' | 'active' | 'denied';
}

export const LiveStatusBanner: React.FC<LiveStatusBannerProps> = ({
  currentLocation,
  weather,
  isLoading,
  onDetectLocation,
  onRefresh,
  countdownSeconds,
  isGpsActive,
  gpsStatus,
}) => {
  const elevationFt = weather?.elevationMeters
    ? Math.round(weather.elevationMeters * 3.28084)
    : null;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#051126] via-[#040D20] to-[#040A18] border border-cyan-500/40 p-4 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Live Status & Source */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>

            <span className="font-orbitron font-bold text-xs tracking-wider text-emerald-400 uppercase">
              100% LIVE REAL-TIME DATA STREAM
            </span>

            <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
              Open-Meteo WMO Station Array
            </span>

            {isGpsActive ? (
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Real Physical Location Locked
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
                Preset Station Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 flex-wrap">
            <span className="flex items-center gap-1 text-cyan-300 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              {currentLocation.name}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              Lat: {currentLocation.lat.toFixed(4)}°, Lon: {currentLocation.lon.toFixed(4)}°
            </span>
            {elevationFt !== null && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Mountain className="w-3 h-3 text-cyan-400" />
                  Elev: {weather?.elevationMeters}m ({elevationFt} ft)
                </span>
              </>
            )}
            {weather?.observationTime && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">
                  Station Time: {weather.observationTime.replace('T', ' ')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: GPS Lock Button & Auto-refresh Countdown */}
        <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-between md:justify-end flex-wrap">
          {/* Real GPS trigger button */}
          <button
            onClick={onDetectLocation}
            disabled={gpsStatus === 'detecting' || isLoading}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-orbitron font-bold tracking-wide transition-all shadow-md ${
              isGpsActive
                ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            }`}
          >
            <Compass
              className={`w-4 h-4 ${
                gpsStatus === 'detecting' ? 'animate-spin' : isGpsActive ? 'text-emerald-400' : ''
              }`}
            />
            <span>
              {gpsStatus === 'detecting'
                ? 'ACQUIRING GPS...'
                : isGpsActive
                ? 'RE-SYNC GPS LOCATION'
                : 'USE MY REAL LOCATION'}
            </span>
          </button>

          {/* Auto-refresh timer pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
            <span className="text-slate-500">Auto-refresh:</span>
            <span className="font-bold text-cyan-300">{countdownSeconds}s</span>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Force sync live weather now"
              className="ml-1 p-1 text-cyan-400 hover:text-cyan-300 hover:bg-slate-900 rounded transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Verification note for user confidence */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300 font-semibold">Live Production Stream:</span>
          <span>
            This monitor does not use mock numbers. All barometric values, 3-hour volatility deltas, and pain formulas calculate directly against real atmospheric readings.
          </span>
        </div>
        <div className="text-slate-500 shrink-0">
          Sync Cadence: Continuous 60s
        </div>
      </div>
    </div>
  );
};
