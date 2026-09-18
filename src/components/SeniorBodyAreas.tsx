import React from 'react';
import { Activity, Heart, Shield, Sparkles } from 'lucide-react';
import { PainScores } from '../types';

interface SeniorBodyAreasProps {
  scores: PainScores;
  isLargeText: boolean;
}

export const SeniorBodyAreas: React.FC<SeniorBodyAreasProps> = ({ scores, isLargeText }) => {
  const areas = [
    {
      title: 'Knees, Hips & Hands',
      subtitle: 'Arthritis & Joint Stiffness',
      icon: '🦵',
      score: scores.JOINT_PAIN,
      tip:
        scores.JOINT_PAIN >= 7
          ? 'Air pressure is low today. Joints may feel extra stiff. Use a warm heating pad, take a warm shower, and avoid heavy lifting.'
          : scores.JOINT_PAIN >= 4
          ? 'Mild joint stiffness possible. Keep your knees and hands warm, and try some gentle hand or ankle circles.'
          : 'Joints should feel comfortable today! A wonderful day for a walk or spending time in the yard.',
    },
    {
      title: 'Head & Sinuses',
      subtitle: 'Weather-Related Headaches',
      icon: '💆',
      score: scores.HEADACHE,
      tip:
        scores.HEADACHE >= 7
          ? 'Sudden air pressure changes may trigger headaches or sinus throbbing. Drink plenty of fresh water and rest in a quiet room if needed.'
          : scores.HEADACHE >= 4
          ? 'Slight pressure shift detected. Keep a tall glass of water nearby and stay hydrated.'
          : 'Air pressure is steady. Low chance of weather-related headaches today.',
    },
    {
      title: 'Back & Neck',
      subtitle: 'Muscle Tightness & Stiff Spine',
      icon: '🚶',
      score: scores.BACK_PAIN,
      tip:
        scores.BACK_PAIN >= 7
          ? 'Chilly air or damp breeze can cause back muscles to tighten. Wear a warm sweater and avoid sitting in cold drafts.'
          : scores.BACK_PAIN >= 4
          ? 'Mild stiffness possible. Take gentle standing breaks every hour and roll your shoulders.'
          : 'Muscles should feel relaxed today. Great day to move comfortably.',
    },
  ];

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-5 sm:p-7 space-y-5">
      <div className="border-b border-slate-200 pb-3">
        <h3 className={`font-bold text-slate-900 ${isLargeText ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
          How Different Parts of Your Body Might Feel Today
        </h3>
        <p className={`text-slate-600 font-medium ${isLargeText ? 'text-lg' : 'text-base'}`}>
          Specific forecasts for your joints, head, and back
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {areas.map((area, idx) => {
          let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
          let levelText = 'Low Ache (Calm)';
          let barColor = 'bg-emerald-500';

          if (area.score >= 7) {
            badgeBg = 'bg-rose-100 text-rose-800 border-rose-300';
            levelText = 'Elevated Aches';
            barColor = 'bg-rose-500';
          } else if (area.score >= 4) {
            badgeBg = 'bg-amber-100 text-amber-800 border-amber-300';
            levelText = 'Mild Stiffness';
            barColor = 'bg-amber-500';
          }

          return (
            <div
              key={idx}
              className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl" role="img" aria-label={area.title}>
                    {area.icon}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeBg}`}>
                    {levelText}
                  </span>
                </div>

                <h4 className={`font-bold text-slate-900 ${isLargeText ? 'text-xl' : 'text-lg'}`}>
                  {area.title}
                </h4>
                <p className="text-sm font-semibold text-slate-500 mb-3">
                  {area.subtitle}
                </p>

                {/* Visual meter */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-sm font-bold text-slate-700">
                    <span>Ache Score:</span>
                    <span className="text-slate-900">{area.score} / 10</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${(area.score / 10) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Practical Advice Tip */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-slate-700">
                  <strong className="block text-xs uppercase tracking-wider text-slate-500 mb-1 font-bold">
                    Helpful Tip:
                  </strong>
                  <p className={`font-medium leading-relaxed ${isLargeText ? 'text-base text-slate-800' : 'text-sm text-slate-700'}`}>
                    {area.tip}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
