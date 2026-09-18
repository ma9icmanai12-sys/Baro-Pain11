import React, { useState } from 'react';
import { Check, Smile, Meh, Frown, Save, Calendar, Trash2, ShieldCheck, Heart } from 'lucide-react';
import { DbHelper } from '../services/dbHelper';
import { WeatherMetrics, PainLogEntry } from '../types';

interface SeniorCheckInProps {
  weather: WeatherMetrics;
  logs: PainLogEntry[];
  onLogsChanged: () => void;
  isLargeText: boolean;
}

export const SeniorCheckIn: React.FC<SeniorCheckInProps> = ({
  weather,
  logs,
  onLogsChanged,
  isLargeText,
}) => {
  const [selectedFeeling, setSelectedFeeling] = useState<'good' | 'stiff' | 'hurting'>('good');
  const [customScore, setCustomScore] = useState<number>(2);
  const [note, setNote] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const cleanHumidity = parseFloat(weather.humidity.replace('%', '')) || 50;
  const cleanWind = parseFloat(weather.windSpeed.replace(' mph', '')) || 10;
  const cleanTemp = parseFloat(weather.temperature.replace('°F', '')) || 68;

  const handleSelectFeeling = (feeling: 'good' | 'stiff' | 'hurting') => {
    setSelectedFeeling(feeling);
    if (feeling === 'good') setCustomScore(2);
    if (feeling === 'stiff') setCustomScore(5);
    if (feeling === 'hurting') setCustomScore(8);
  };

  const handleSave = () => {
    DbHelper.logDailyPain({
      score: customScore,
      pressure: weather.currentPressureInHg,
      humidity: cleanHumidity,
      wind: cleanWind,
      temperature: cleanTemp,
      notes: note.trim(),
    });

    setSavedSuccess(true);
    onLogsChanged();
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleDelete = (id: string) => {
    DbHelper.deleteLog(id);
    onLogsChanged();
  };

  // Get recent 5 logs
  const recentLogs = [...logs].reverse().slice(0, 5);

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-5 sm:p-7 space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h3 className={`font-bold text-slate-900 ${isLargeText ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
          Daily Joint & Body Check-In
        </h3>
        <p className={`text-slate-600 font-medium ${isLargeText ? 'text-lg' : 'text-base'}`}>
          Keep a simple diary so you can see how weather patterns affect you over time
        </p>
      </div>

      {/* 3 Giant Tap Targets for Seniors */}
      <div role="group" aria-labelledby="joint-feeling-legend">
        <div id="joint-feeling-legend" className="block text-slate-800 font-bold text-lg mb-3">
          How are your joints feeling right now?
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Feeling Good */}
          <button
            type="button"
            onClick={() => handleSelectFeeling('good')}
            className={`p-5 rounded-2xl border-3 flex flex-col items-center text-center gap-2 transition-all shadow-sm ${
              selectedFeeling === 'good'
                ? 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <span className="text-5xl">😊</span>
            <span className={`font-bold text-slate-900 ${isLargeText ? 'text-2xl' : 'text-xl'}`}>
              Feeling Good
            </span>
            <span className="text-sm font-medium text-slate-600">
              Low or no aches today (Score 1-3)
            </span>
          </button>

          {/* A Bit Stiff */}
          <button
            type="button"
            onClick={() => handleSelectFeeling('stiff')}
            className={`p-5 rounded-2xl border-3 flex flex-col items-center text-center gap-2 transition-all shadow-sm ${
              selectedFeeling === 'stiff'
                ? 'bg-amber-50 border-amber-500 ring-4 ring-amber-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <span className="text-5xl">😐</span>
            <span className={`font-bold text-slate-900 ${isLargeText ? 'text-2xl' : 'text-xl'}`}>
              A Bit Stiff
            </span>
            <span className="text-sm font-medium text-slate-600">
              Mild or moderate stiffness (Score 4-6)
            </span>
          </button>

          {/* Hurting Today */}
          <button
            type="button"
            onClick={() => handleSelectFeeling('hurting')}
            className={`p-5 rounded-2xl border-3 flex flex-col items-center text-center gap-2 transition-all shadow-sm ${
              selectedFeeling === 'hurting'
                ? 'bg-rose-50 border-rose-500 ring-4 ring-rose-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <span className="text-5xl">😣</span>
            <span className={`font-bold text-slate-900 ${isLargeText ? 'text-2xl' : 'text-xl'}`}>
              Hurting Today
            </span>
            <span className="text-sm font-medium text-slate-600">
              Noticeable or sharp pain (Score 7-10)
            </span>
          </button>
        </div>
      </div>

      {/* Optional Note Field */}
      <div>
        <label htmlFor="daily-note" className="block text-slate-800 font-bold text-base mb-1.5">
          Any note for today? (Optional):
        </label>
        <input
          id="daily-note"
          type="text"
          placeholder="e.g. Left knee stiff after waking up, took an aspirin"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 text-base focus:outline-hidden focus:border-sky-500"
        />
      </div>

      {/* Big Green Save Button */}
      <div>
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xl shadow-md transition-all flex items-center justify-center gap-3"
        >
          <Check className="w-7 h-7" />
          <span>Save Today's Check-In</span>
        </button>
      </div>

      {/* Confirmation Banner */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-100 border-2 border-emerald-400 text-emerald-950 font-bold text-lg flex items-center gap-3 animate-in fade-in duration-200">
          <Heart className="w-6 h-6 text-emerald-600 shrink-0" />
          <span>✓ Saved for today! Great job keeping track of your health.</span>
        </div>
      )}

      {/* Past Diary Entries */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <h4 className="text-slate-900 font-bold text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-600" />
          <span>Your Saved Check-Ins:</span>
        </h4>

        {recentLogs.length > 0 ? (
          <div className="space-y-2.5">
            {recentLogs.map((entry) => {
              let tagColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
              let emoji = '😊';
              let tagLabel = 'Feeling Good';

              if (entry.user_pain_score >= 7) {
                tagColor = 'bg-rose-100 text-rose-800 border-rose-300';
                emoji = '😣';
                tagLabel = 'Hurting';
              } else if (entry.user_pain_score >= 4) {
                tagColor = 'bg-amber-100 text-amber-800 border-amber-300';
                emoji = '😐';
                tagLabel = 'A Bit Stiff';
              }

              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 text-base">{entry.date_logged}</strong>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tagColor}`}>
                          {tagLabel} ({entry.user_pain_score}/10)
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">
                        Weather: {entry.pressure_in_hg} inHg • {entry.humidity_percent}% humidity
                        {entry.notes && <span className="text-slate-800 font-semibold"> • "{entry.notes}"</span>}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="self-end sm:self-auto p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Delete this entry"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-slate-600 text-base text-center">
            No entries recorded yet. Tap one of the three buttons above and click <strong>"Save Today's Check-In"</strong> to record your first entry.
          </div>
        )}
      </div>
    </div>
  );
};
