import React from 'react';
import { Table, Trash2, Download, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { PainLogEntry } from '../types';
import { DbHelper, PainCalculator } from '../services';

interface HistoryMatrixProps {
  logs: PainLogEntry[];
  onLogsChanged: () => void;
}

export const HistoryMatrix: React.FC<HistoryMatrixProps> = ({ logs, onLogsChanged }) => {
  const handleDelete = (id: string) => {
    DbHelper.deleteLog(id);
    onLogsChanged();
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pain_monitor_history_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearAll = () => {
    if (confirm('Clear all historical pain logs?')) {
      DbHelper.clearAll();
      onLogsChanged();
    }
  };

  return (
    <div className="rounded-2xl bg-[#040A18] border border-cyan-500/30 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-orbitron font-bold tracking-wider text-cyan-400 uppercase">
              Clinical Telemetry Matrix (SQLite Schema Mirror)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              30-Day Chronological Log Database • Barometric Correlation Records
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleClearAll}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-xs font-mono text-slate-400 hover:text-rose-300 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Table presentation */}
      {logs.length === 0 ? (
        <div className="text-center py-8 text-slate-400 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
          No records logged yet. Use the daily logger above or click "Seed 7-Day Matrix" to start.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/90 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3.5 py-2.5">Date</th>
                <th className="px-3.5 py-2.5">Pain Score</th>
                <th className="px-3.5 py-2.5">Pressure</th>
                <th className="px-3.5 py-2.5">Humidity</th>
                <th className="px-3.5 py-2.5">Wind</th>
                <th className="px-3.5 py-2.5">Temp</th>
                <th className="px-3.5 py-2.5">Notes</th>
                <th className="px-3.5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {logs.map((entry) => {
                const severity = PainCalculator.getSeverityLabel(entry.user_pain_score);
                const isTriggerPressure = entry.pressure_in_hg < 29.80;
                const isHighPain = entry.user_pain_score >= 7;

                return (
                  <tr
                    key={entry.id}
                    className={`hover:bg-slate-900/50 transition-colors ${
                      isHighPain && isTriggerPressure ? 'bg-rose-950/15' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="px-3.5 py-2.5 text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{entry.date_logged}</span>
                        {entry.time_logged && (
                          <span className="text-[10px] text-slate-500">({entry.time_logged})</span>
                        )}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-3.5 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${severity.bg} ${severity.color}`}
                      >
                        {entry.user_pain_score}/10
                      </span>
                    </td>

                    {/* Pressure */}
                    <td className="px-3.5 py-2.5 text-slate-200 whitespace-nowrap">
                      <span
                        className={isTriggerPressure ? 'text-amber-400 font-bold' : 'text-slate-200'}
                      >
                        {entry.pressure_in_hg.toFixed(2)} inHg
                      </span>
                      {isTriggerPressure && (
                        <span className="text-[9px] text-rose-400 block">Low Front</span>
                      )}
                    </td>

                    {/* Humidity */}
                    <td className="px-3.5 py-2.5 text-slate-300 whitespace-nowrap">
                      {entry.humidity_percent}%
                    </td>

                    {/* Wind */}
                    <td className="px-3.5 py-2.5 text-slate-300 whitespace-nowrap">
                      {entry.wind_speed_mph} mph
                    </td>

                    {/* Temp */}
                    <td className="px-3.5 py-2.5 text-slate-300 whitespace-nowrap">
                      {entry.temperature_f ? `${entry.temperature_f}°F` : '—'}
                    </td>

                    {/* Notes */}
                    <td className="px-3.5 py-2.5 text-slate-400 max-w-xs truncate">
                      {entry.notes || <span className="text-slate-600">—</span>}
                    </td>

                    {/* Action */}
                    <td className="px-3.5 py-2.5 text-right">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
