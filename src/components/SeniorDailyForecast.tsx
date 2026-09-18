import React, { useState } from 'react';
import {
  Calendar,
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  CloudSnow,
  CloudFog,
  TrendingDown,
  TrendingUp,
  Minus,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Droplets,
  Wind,
  Gauge,
  Thermometer,
} from 'lucide-react';
import { DailyForecastItem } from '../types';

interface SeniorDailyForecastProps {
  forecast: DailyForecastItem[];
  isLargeText: boolean;
  embedded?: boolean;
}

export const SeniorDailyForecast: React.FC<SeniorDailyForecastProps> = ({
  forecast,
  isLargeText,
  embedded = false,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  if (!forecast || forecast.length === 0) {
    return null;
  }

  const todayForecast = forecast[0];
  const upcomingForecast = forecast.slice(1);
  const selectedDay = forecast[selectedDayIndex] || todayForecast;
  const isViewingUpcoming = selectedDayIndex > 0;

  // Helper to render weather icon
  const renderWeatherIcon = (code: number, sizeClass = 'w-8 h-8') => {
    if (code === 0) return <Sun className={`${sizeClass} text-amber-500`} />;
    if (code === 1 || code === 2) return <Sun className={`${sizeClass} text-amber-500`} />;
    if (code === 3) return <Cloud className={`${sizeClass} text-slate-500`} />;
    if (code >= 45 && code <= 48) return <CloudFog className={`${sizeClass} text-slate-400`} />;
    if (code >= 51 && code <= 67) return <CloudRain className={`${sizeClass} text-sky-500`} />;
    if (code >= 71 && code <= 77) return <CloudSnow className={`${sizeClass} text-cyan-400`} />;
    if (code >= 80 && code <= 82) return <CloudRain className={`${sizeClass} text-sky-600`} />;
    if (code >= 85 && code <= 86) return <CloudSnow className={`${sizeClass} text-cyan-500`} />;
    if (code >= 95) return <CloudLightning className={`${sizeClass} text-purple-600`} />;
    return <Cloud className={`${sizeClass} text-slate-400`} />;
  };

  const RootTag = embedded ? 'div' : 'section';

  return (
    <RootTag
      id="senior-daily-forecast-section"
      aria-labelledby="forecast-heading"
      className={
        embedded
          ? 'rounded-2xl border-2 border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-6 shadow-sm'
          : 'bg-white rounded-3xl border-2 border-slate-200 shadow-md p-5 sm:p-7 space-y-6'
      }
    >
      {/* 1. TODAY (Prominently Above Upcoming Days - Tightened & Compact) */}
      <div id="forecast-today-section" className="space-y-3">
        {/* Today's Hero Card */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-3.5 sm:p-4 space-y-3 shadow-sm">
          {/* Top Row: Weather Summary + Compact Ache Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-50 border border-sky-100 shadow-inner shrink-0">
                {renderWeatherIcon(todayForecast.weatherCode, 'w-8 h-8 sm:w-9 sm:h-9')}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base sm:text-lg font-black text-slate-900">
                    Today's Forecast
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-xs font-bold">
                    {todayForecast.formattedDate}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {todayForecast.weatherDescription}
                  </span>
                </div>
                <p className="text-slate-600 font-semibold text-xs sm:text-sm mt-0.5">
                  High: <strong>{todayForecast.tempMax}°F</strong> • Low: <strong>{todayForecast.tempMin}°F</strong> • Rain Chance: <strong>{todayForecast.precipitationProbability}%</strong> ({todayForecast.precipitationInches}")
                </p>
              </div>
            </div>

            {/* Compact Ache Score Badge */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Today's Ache Risk
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-slate-900">
                    {todayForecast.painHeadline}
                  </div>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm ${
                    todayForecast.predictedRiskLevel === 'high'
                      ? 'bg-rose-600'
                      : todayForecast.predictedRiskLevel === 'moderate'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                >
                  <span>{todayForecast.predictedPainScore}</span>
                  <span className="text-[9px] font-normal opacity-80 ml-0.5">/10</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Compact Telemetry Pills for Today */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {/* 1. Pressure Front */}
            <div className="bg-slate-50/90 rounded-xl border border-slate-200/80 p-2.5 space-y-0.5">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
                <span>Pressure Front</span>
              </div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                {todayForecast.frontBadge}
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                {todayForecast.frontDescription}
              </p>
            </div>

            {/* 2. Barometer Range */}
            <div className="bg-slate-50/90 rounded-xl border border-slate-200/80 p-2.5 space-y-0.5">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Gauge className="w-3 h-3 text-sky-600 shrink-0" />
                <span>Barometer Trend</span>
              </div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                {todayForecast.avgPressureInHg} inHg
              </div>
              <p className="text-[11px] text-sky-800 font-semibold truncate leading-tight">
                Trend: {todayForecast.pressureTrend}
              </p>
            </div>

            {/* 3. Temp Shift */}
            <div className="bg-slate-50/90 rounded-xl border border-slate-200/80 p-2.5 space-y-0.5">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Thermometer className="w-3 h-3 text-rose-500 shrink-0" />
                <span>Temp Shift</span>
              </div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                {todayForecast.tempChangeFromPrev <= -4 ? (
                  <span className="text-blue-700 flex items-center gap-0.5">
                    <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
                    {Math.abs(todayForecast.tempChangeFromPrev)}°F Colder
                  </span>
                ) : todayForecast.tempChangeFromPrev >= 4 ? (
                  <span className="text-amber-700 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    +{todayForecast.tempChangeFromPrev}°F Warmer
                  </span>
                ) : (
                  <span className="text-slate-700 flex items-center gap-0.5">
                    <Minus className="w-3.5 h-3.5 text-slate-400" />
                    Steady
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                {todayForecast.tempChangeFromPrev <= -6
                  ? 'Cold drop tightens joints.'
                  : todayForecast.tempChangeFromPrev >= 6
                  ? 'Milder air eases stiffness.'
                  : 'Minimal thermal impact.'}
              </p>
            </div>

            {/* 4. Rain & Wind */}
            <div className="bg-slate-50/90 rounded-xl border border-slate-200/80 p-2.5 space-y-0.5">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <Droplets className="w-3 h-3 text-sky-600 shrink-0" />
                <span>Rain & Wind</span>
              </div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                {todayForecast.precipitationProbability}% Chance
              </div>
              <p className="text-[11px] text-slate-600 truncate leading-tight">
                Rain: {todayForecast.precipitationInches}" • Wind: {todayForecast.windSpeedMax} mph
              </p>
            </div>
          </div>

          {/* Today's Joint Guidance (Compact banner) */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/90 border border-sky-200 flex items-start sm:items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-200 text-sky-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Info className="w-4 h-4" />
            </div>
            <p className="text-slate-800 font-medium text-xs sm:text-sm leading-snug">
              <strong className="text-sky-950 font-bold mr-1">Today's Joint Tip:</strong>
              {todayForecast.advice}
            </p>
          </div>
        </div>
      </div>

      {/* 2. UPCOMING DAYS (Placed Directly Below Today) */}
      <div id="forecast-upcoming-section" className="space-y-3 pt-2 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span>Upcoming Days: Forecast & Joint Predictions</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Tap any upcoming day to preview front movements, pressure trends, and expected ache levels:
            </p>
          </div>

          {isViewingUpcoming && (
            <button
              onClick={() => setSelectedDayIndex(0)}
              className="px-3 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-xs transition-colors self-start sm:self-auto"
            >
              Reset to Today
            </button>
          )}
        </div>

        {/* 6 Upcoming Day Cards */}
        <div
          id="upcoming-days-grid"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
        >
          {upcomingForecast.map((day, offsetIdx) => {
            const actualIdx = offsetIdx + 1;
            const isSelected = actualIdx === selectedDayIndex;
            const isHighRisk = day.predictedRiskLevel === 'high';
            const isModRisk = day.predictedRiskLevel === 'moderate';

            let badgeBg = 'bg-emerald-100 text-emerald-900 border border-emerald-300';
            let barColor = 'bg-emerald-500';

            if (isHighRisk) {
              badgeBg = 'bg-rose-100 text-rose-950 border border-rose-300 font-bold';
              barColor = 'bg-rose-500';
            } else if (isModRisk) {
              badgeBg = 'bg-amber-100 text-amber-950 border border-amber-300 font-bold';
              barColor = 'bg-amber-500';
            }

            return (
              <button
                key={day.date}
                id={`upcoming-day-btn-${actualIdx}`}
                type="button"
                onClick={() => setSelectedDayIndex(actualIdx)}
                className={`relative text-left p-3 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'ring-4 ring-sky-500/30 shadow-md border-sky-600 bg-white scale-[1.02] z-10'
                    : 'hover:border-slate-400 bg-white/90 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {day.dayLabel}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {day.formattedDate}
                    </span>
                  </div>

                  {/* Weather Icon & Rain */}
                  <div className="my-2 flex items-center justify-between">
                    {renderWeatherIcon(day.weatherCode, 'w-8 h-8')}
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">
                        {day.tempMax}°
                        <span className="text-slate-400 text-[10px] font-normal ml-0.5">/ {day.tempMin}°</span>
                      </div>
                      <div className="flex items-center justify-end gap-0.5 text-[10px] font-semibold text-sky-700">
                        <Droplets className="w-2.5 h-2.5 text-sky-500 shrink-0" />
                        <span>{day.precipitationProbability}%</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] font-medium text-slate-600 truncate mb-1.5">
                    {day.weatherDescription}
                  </p>
                </div>

                {/* Ache Prediction Bar */}
                <div className="mt-1 pt-1.5 border-t border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-600">Ache:</span>
                    <span className={`px-1.5 py-0.2 rounded ${badgeBg}`}>
                      {day.predictedPainScore}/10
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${Math.min(100, day.predictedPainScore * 10)}%` }}
                    />
                  </div>

                  <div className="text-[10px] font-bold text-center truncate">
                    {isHighRisk && <span className="text-rose-700">🔴 High Ache</span>}
                    {isModRisk && <span className="text-amber-800">🟡 Moderate</span>}
                    {!isHighRisk && !isModRisk && <span className="text-emerald-700">🟢 Calm</span>}
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                    Selected
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Upcoming Day Detail Breakdown */}
        {isViewingUpcoming && (
          <div
            id="upcoming-day-detail-card"
            className="rounded-2xl border-2 border-sky-300 bg-white p-4 sm:p-5 space-y-4 shadow-sm animate-in fade-in duration-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100">
                  {renderWeatherIcon(selectedDay.weatherCode, 'w-8 h-8')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-lg font-bold text-slate-900">
                      {selectedDay.dayLabel} ({selectedDay.formattedDate})
                    </h5>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                      {selectedDay.weatherDescription}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Expected High: <strong>{selectedDay.tempMax}°F</strong> • Low: <strong>{selectedDay.tempMin}°F</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Predicted Ache</div>
                  <div className="text-sm font-bold text-slate-900">{selectedDay.painHeadline}</div>
                </div>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm ${
                    selectedDay.predictedRiskLevel === 'high'
                      ? 'bg-rose-600'
                      : selectedDay.predictedRiskLevel === 'moderate'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                >
                  {selectedDay.predictedPainScore}
                </div>
              </div>
            </div>

            {/* 4 Detail Badges for selected upcoming day */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pressure Front</div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">{selectedDay.frontBadge}</div>
                <p className="text-[11px] text-slate-600 mt-1">{selectedDay.frontDescription}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Barometer Range</div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">{selectedDay.avgPressureInHg} inHg</div>
                <div className="text-[11px] text-sky-700 font-semibold mt-1">24h Trend: {selectedDay.pressureTrend}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Temp Shift</div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                  {selectedDay.tempChangeFromPrev <= -4
                    ? `${Math.abs(selectedDay.tempChangeFromPrev)}°F Colder`
                    : selectedDay.tempChangeFromPrev >= 4
                    ? `+${selectedDay.tempChangeFromPrev}°F Warmer`
                    : 'Steady'}
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  {selectedDay.tempChangeFromPrev <= -6 ? 'Cold air sharpens joint tension.' : 'Mild thermal impact.'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rain & Wind</div>
                <div className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                  {selectedDay.precipitationProbability}% Chance
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Rain: {selectedDay.precipitationInches}" • Wind: {selectedDay.windSpeedMax} mph
                </div>
              </div>
            </div>

            {/* Advice */}
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs sm:text-sm text-slate-800 font-medium">
              <strong>Joint Advice for {selectedDay.dayLabel}:</strong> {selectedDay.advice}
            </div>
          </div>
        )}
      </div>
    </RootTag>
  );
};
