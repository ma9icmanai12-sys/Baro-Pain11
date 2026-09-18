import { WeatherMetrics, PainScores } from '../types';

export class PainCalculator {
  /**
   * Calculates granular pain indices based on clinical barometric formulas:
   * - Joint Pain: [(30.20 - Pressure) * 12] * 0.60 + [Humidity / 100 * 10] * 0.40
   * - Headache: [|3-Hour Pressure Change| * 35] * 0.70 + [|70 - Temperature| / 25 * 10] * 0.30
   * - Back Pain: [WindSpeed / 35 * 10] * 0.50 + [(65 - Temperature).clamp(0, 40) / 40 * 10] * 0.50
   * - Neck Pain: (Back Pain - 1).clamp(1, 10)
   */
  static calculateGranularPain(metrics: WeatherMetrics): PainScores {
    try {
      // 1. Joint Pain Calculation
      const rawPressureDelta = 30.20 - metrics.currentPressureInHg;
      const pressureDelta = Math.max(0.0, Math.min(1.0, rawPressureDelta));
      const jointPres = pressureDelta * 10.0;

      const cleanHum = parseFloat(metrics.humidity.replace('%', '')) || 50.0;
      const jointHum = (cleanHum / 100.0) * 10.0;
      const finalJoint = Math.max(1, Math.min(10, Math.round((jointPres * 0.60) + (jointHum * 0.40))));

      // 2. Headache / Migraine Calculation
      const absChange = Math.abs(metrics.change3Hour);
      const headTrend = Math.max(0.0, Math.min(10.0, absChange * 35.0));

      const cleanTemp = parseFloat(metrics.temperature.replace('°F', '')) || 70.0;
      const tempVar = Math.max(0.0, Math.min(25.0, Math.abs(70.0 - cleanTemp)));
      const finalHead = Math.max(
        1,
        Math.min(10, Math.round((headTrend * 0.70) + ((tempVar / 25.0) * 10.0) * 0.30))
      );

      // 3. Back & Core Tension Calculation
      const cleanWind = parseFloat(metrics.windSpeed.replace(' mph', '')) || 10.0;
      const backWind = Math.max(0.0, Math.min(1.0, cleanWind / 35.0)) * 10.0;
      const tempDrop = Math.max(0.0, Math.min(40.0, 65.0 - cleanTemp));
      const finalBack = Math.max(
        1,
        Math.min(10, Math.round((backWind * 0.50) + ((tempDrop / 40.0) * 10.0) * 0.50))
      );

      // 4. Neck Pain (Linked to Back tension)
      const finalNeck = Math.max(1, Math.min(10, finalBack - 1));

      // 5. Aggregate Risk Index: ((Head + Joint + Back) / 3.0) * 10.0
      const overallRisk = Math.max(0, Math.min(100, Math.round(((finalHead + finalJoint + finalBack) / 3.0) * 10.0)));

      return {
        HEADACHE: finalHead,
        JOINT_PAIN: finalJoint,
        BACK_PAIN: finalBack,
        NECK_PAIN: finalNeck,
        overallRisk,
        breakdown: {
          jointPressureComponent: Number((jointPres * 0.60).toFixed(1)),
          jointHumidityComponent: Number((jointHum * 0.40).toFixed(1)),
          headacheTrendComponent: Number((headTrend * 0.70).toFixed(1)),
          headacheTempComponent: Number((((tempVar / 25.0) * 10.0) * 0.30).toFixed(1)),
          backWindComponent: Number((backWind * 0.50).toFixed(1)),
          backTempComponent: Number((((tempDrop / 40.0) * 10.0) * 0.50).toFixed(1)),
        },
      };
    } catch {
      return {
        HEADACHE: 5,
        JOINT_PAIN: 5,
        BACK_PAIN: 5,
        NECK_PAIN: 4,
        overallRisk: 50,
        breakdown: {
          jointPressureComponent: 3,
          jointHumidityComponent: 2,
          headacheTrendComponent: 3,
          headacheTempComponent: 2,
          backWindComponent: 2.5,
          backTempComponent: 2.5,
        },
      };
    }
  }

  static getSeverityLabel(score: number): { label: string; color: string; bg: string } {
    if (score <= 2) return { label: 'MINIMAL', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (score <= 4) return { label: 'LOW', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' };
    if (score <= 6) return { label: 'MODERATE', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' };
    if (score <= 8) return { label: 'ELEVATED', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { label: 'SEVERE', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
  }
}

export { DbHelper } from './dbHelper';
export { voiceService } from './voiceService';

