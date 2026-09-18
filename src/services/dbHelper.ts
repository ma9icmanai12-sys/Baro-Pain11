import { PainLogEntry } from '../types';

const STORAGE_KEY = 'pain_monitor_logs_v1';

export class DbHelper {
  static getHistoryMatrix(): PainLogEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed: PainLogEntry[] = JSON.parse(raw);
      return parsed.sort((a, b) => a.date_logged.localeCompare(b.date_logged));
    } catch {
      return [];
    }
  }

  static logDailyPain(params: {
    score: number;
    pressure: number;
    humidity: number;
    wind: number;
    temperature?: number;
    notes?: string;
  }): PainLogEntry {
    const logs = this.getHistoryMatrix();
    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Look for existing entry for today to replace or update
    const existingIndex = logs.findIndex((l) => l.date_logged === today);
    const newEntry: PainLogEntry = {
      id: existingIndex >= 0 ? logs[existingIndex].id : `log_${Date.now()}`,
      date_logged: today,
      time_logged: timeStr,
      user_pain_score: Math.max(1, Math.min(10, params.score)),
      pressure_in_hg: Number(params.pressure.toFixed(2)),
      humidity_percent: Math.round(params.humidity),
      wind_speed_mph: Math.round(params.wind),
      temperature_f: params.temperature ? Math.round(params.temperature) : 68,
      notes: params.notes || '',
    };

    if (existingIndex >= 0) {
      logs[existingIndex] = newEntry;
    } else {
      logs.push(newEntry);
    }

    // Keep sorted by date
    logs.sort((a, b) => a.date_logged.localeCompare(b.date_logged));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    return newEntry;
  }

  static deleteLog(id: string): void {
    const logs = this.getHistoryMatrix().filter((l) => l.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }

  static clearAll(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}
