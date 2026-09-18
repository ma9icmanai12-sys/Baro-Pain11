import React from 'react';
import { Sun, CloudRain, Wind, Thermometer, ShieldCheck, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';
import { WeatherMetrics, PainScores } from '../types';
import { SeniorDailyForecast } from './SeniorDailyForecast';
import { VoiceForecastButton } from './VoiceForecastButton';

interface SeniorMainRiskProps {
  weather: WeatherMetrics;
  painScores: PainScores;
  isLargeText: boolean;
  locationName: string;
  isGpsActive: boolean;
  onDetectLocation: () => void;
  onSpeakForecast?: () => void;
  isSpeaking?: boolean;
}

export const SeniorMainRisk: React.FC<SeniorMainRiskProps> = ({
  weather,
  painScores,
  isLargeText,
  locationName,
  isGpsActive,
  onDetectLocation,
  onSpeakForecast,
  isSpeaking = false,
}) => {
  // If Today's forecast is available, synchronize the primary risk display directly with Today's calculated score
  const todayForecast = weather.forecastDays && weather.forecastDays.length > 0 ? weather.forecastDays[0] : null;

  // Unified score out of 10
  const acheScoreOutOfTen = todayForecast
    ? todayForecast.predictedPainScore
    : Math.max(1, Math.min(10, Math.round(painScores.overallRisk / 10)));

  // Determine overall plain-English category
  let riskCategory: 'low' | 'moderate' | 'high' = 'low';
  let bannerBg = 'bg-emerald-50 border-emerald-400 text-emerald-950';
  let badgeBg = 'bg-emerald-600 text-white';
  let title = 'Good Day for Your Joints';
  let message =
    'The air pressure is calm and steady. Most people with arthritis and chronic aches feel comfortable on days like this. Enjoy a gentle walk, gardening, or your favorite hobby!';
  let icon = <CheckCircle className="w-10 h-10 text-emerald-600 shrink-0" />;

  if (acheScoreOutOfTen >= 7) {
    riskCategory = 'high';
    bannerBg = 'bg-rose-50 border-rose-400 text-rose-950';
    badgeBg = 'bg-rose-600 text-white';
    title = todayForecast?.painHeadline || 'High Ache Alert';
    message =
      todayForecast?.advice ||
      'A storm, cold front, or rapid pressure drop is in effect. Body tissues expand when air pressure falls, which can make arthritis and stiff joints ache more. Stay warm, relax, and keep a heating pad or warm tea handy.';
    icon = <AlertTriangle className="w-10 h-10 text-rose-600 shrink-0" />;
  } else if (acheScoreOutOfTen >= 4) {
    riskCategory = 'moderate';
    bannerBg = 'bg-amber-50 border-amber-400 text-amber-950';
    badgeBg = 'bg-amber-600 text-white';
    title = todayForecast?.painHeadline || 'Moderate Aches Possible';
    message =
      todayForecast?.advice ||
      'The air pressure or temperature is shifting slightly today. You might feel some morning stiffness in your knees, hips, or hands. Gentle stretching and warm clothing will help you stay comfortable.';
    icon = <AlertTriangle className="w-10 h-10 text-amber-600 shrink-0" />;
  } else {
    title = todayForecast?.painHeadline || 'Good Day for Your Joints';
    message =
      todayForecast?.advice ||
      'The air pressure is calm and steady. Most people with arthritis and chronic aches feel comfortable on days like this. Enjoy a gentle walk, gardening, or your favorite hobby!';
  }

  // Today's formatted friendly date
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-5 sm:p-7 space-y-6">
      {/* Top Date & Location Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <span className="text-sky-800 font-bold text-sm tracking-wide uppercase">
            Today's Daily Forecast
          </span>
          <h2 className={`font-bold text-slate-900 ${isLargeText ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
            {todayFormatted}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-700 font-medium text-base">
            Showing weather for: <strong className="text-slate-900">{locationName}</strong>
          </span>
          {isGpsActive && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> Your Exact Location
            </span>
          )}
        </div>
      </div>

      {/* Primary Traffic-Light Pain Status Card */}
      <div className={`rounded-2xl border-3 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-sm ${bannerBg}`}>
        <div className="flex items-start sm:items-center gap-4 flex-1">
          {icon}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 rounded-lg text-sm font-extrabold uppercase tracking-wider ${badgeBg}`}>
                {title}
              </span>
              <span className="text-slate-700 font-bold text-base">
                Ache Level: {acheScoreOutOfTen} out of 10
              </span>
            </div>

            <p className={`font-medium leading-relaxed ${isLargeText ? 'text-xl text-slate-900' : 'text-lg text-slate-800'}`}>
              {message}
            </p>
          </div>
        </div>

        {/* Prominent Voice Speaker Button embedded inside Today's Risk Card */}
        {onSpeakForecast && (
          <div className="w-full sm:w-auto shrink-0 flex sm:flex-col items-center justify-end">
            <VoiceForecastButton
              onSpeak={onSpeakForecast}
              isSpeaking={isSpeaking}
            />
          </div>
        )}
      </div>

      {/* 7-Day Forecast & Pain Predictions (Right under Good Day for Your Joints) */}
      {weather.forecastDays && weather.forecastDays.length > 0 && (
        <SeniorDailyForecast
          forecast={weather.forecastDays}
          isLargeText={isLargeText}
          embedded
          onSpeakForecast={onSpeakForecast}
          isSpeaking={isSpeaking}
        />
      )}

      {/* Current Weather Quick Glance (Temperature, Barometer, Humidity & Wind) */}
      <div className="pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Right Now Conditions:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Temperature */}
        <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-200 flex items-center justify-center text-sky-700 shrink-0">
            <Thermometer className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wide">Temperature</span>
            <div className={`font-extrabold text-slate-900 ${isLargeText ? 'text-3xl' : 'text-2xl'}`}>
              {weather.temperature}
            </div>
            <span className="text-sm font-medium text-slate-600">
              {parseFloat(weather.temperature) > 75
                ? 'Warm & Pleasant'
                : parseFloat(weather.temperature) > 55
                ? 'Mild & Comfortable'
                : 'Chilly — Dress warmly'}
            </span>
          </div>
        </div>

        {/* Barometer */}
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
            <Sun className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Barometer (Air Pressure)</span>
            <div className={`font-extrabold text-slate-900 ${isLargeText ? 'text-2xl' : 'text-xl'}`}>
              {weather.currentPressureInHg.toFixed(2)} inHg
            </div>
            <span className="text-sm font-bold text-indigo-700">
              {weather.pressureTrend.includes('FALLING')
                ? 'Falling (Rain or front near)'
                : weather.pressureTrend.includes('RISING')
                ? 'Rising (Fair skies)'
                : 'Steady & Calm ➡️'}
            </span>
          </div>
        </div>

        {/* Humidity & Breeze */}
        <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <Wind className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">Humidity & Wind</span>
            <div className={`font-extrabold text-slate-900 ${isLargeText ? 'text-2xl' : 'text-xl'}`}>
              {weather.humidity}
            </div>
            <span className="text-sm font-medium text-slate-600">
              Breeze: {weather.windSpeed}
            </span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
