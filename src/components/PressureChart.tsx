import React, { useState } from 'react';
import { TrendingDown, TrendingUp, Info } from 'lucide-react';

interface PressureChartProps {
  data: number[]; // 24-hour pressure points in inHg
  timestamps?: string[];
  currentTrend: string;
}

export const PressureChart: React.FC<PressureChartProps> = ({
  data,
  timestamps = [],
  currentTrend,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl bg-[#040A18] border border-cyan-500/30 p-5 text-center text-slate-400 font-mono text-xs">
        No barometric telemetry data available for 24-hour curve.
      </div>
    );
  }

  // Calculate bounds
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const minIdx = data.indexOf(minVal);
  const maxIdx = data.indexOf(maxVal);

  // Dynamic Y-range with padding
  const yPadding = 0.05;
  const yMin = Math.floor((minVal - yPadding) * 100) / 100;
  const yMax = Math.ceil((maxVal + yPadding) * 100) / 100;
  const yRange = yMax - yMin || 0.1;

  // Dimensions
  const width = 800;
  const height = 240;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Point projection
  const getX = (i: number) => paddingLeft + (i / (data.length - 1)) * chartWidth;
  const getY = (val: number) => paddingTop + chartHeight - ((val - yMin) / yRange) * chartHeight;

  // Generate smooth SVG path using Catmull-Rom or cubic Bezier
  const points = data.map((val, i) => ({ x: getX(i), y: getY(val), val }));
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  // Area path for gradient fill
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  // Standard Sea Level line (29.92) and Sensitivity threshold (29.80)
  const seaLevelY = getY(29.92);
  const showSeaLevel = 29.92 >= yMin && 29.92 <= yMax;

  const triggerZoneY = getY(29.80);
  const showTrigger = 29.80 >= yMin && 29.80 <= yMax;

  // Grid steps (4 horizontal lines)
  const yTicks = [
    yMin,
    yMin + yRange * 0.33,
    yMin + yRange * 0.66,
    yMax,
  ];

  return (
    <div className="rounded-2xl bg-[#040A18] border border-cyan-500/30 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-orbitron font-bold tracking-wider text-cyan-400 uppercase">
              24-Hour Barometric Pressure Curve
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Continuous atmospheric trend in inHg • High-sensitivity flux detection
            </span>
          </div>
        </div>

        {/* Min/Max stats badges */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase">24h Low:</span>
            <span className="text-rose-400 font-bold">{minVal.toFixed(2)} inHg</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase">24h High:</span>
            <span className="text-cyan-300 font-bold">{maxVal.toFixed(2)} inHg</span>
          </div>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px]"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            {/* Gradient for area fill */}
            <linearGradient id="pressureAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>

            {/* Neon line glow filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {tick.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* 29.92 inHg Standard Sea-Level Reference Line */}
          {showSeaLevel && (
            <g>
              <line
                x1={paddingLeft}
                y1={seaLevelY}
                x2={width - paddingRight}
                y2={seaLevelY}
                stroke="#0284c7"
                strokeDasharray="4 4"
                strokeWidth="1.5"
                opacity="0.7"
              />
              <text
                x={width - paddingRight - 4}
                y={seaLevelY - 4}
                textAnchor="end"
                fill="#38bdf8"
                fontSize="9"
                fontFamily="monospace"
              >
                STD 29.92
              </text>
            </g>
          )}

          {/* 29.80 inHg Pain Trigger Threshold Line */}
          {showTrigger && (
            <g>
              <line
                x1={paddingLeft}
                y1={triggerZoneY}
                x2={width - paddingRight}
                y2={triggerZoneY}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                strokeWidth="1.2"
                opacity="0.6"
              />
              <text
                x={width - paddingRight - 4}
                y={triggerZoneY - 4}
                textAnchor="end"
                fill="#f59e0b"
                fontSize="9"
                fontFamily="monospace"
              >
                TRIGGER ZONE &lt;29.80
              </text>
            </g>
          )}

          {/* Area Fill */}
          <path d={areaD} fill="url(#pressureAreaGradient)" />

          {/* Pressure Curve Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#neonGlow)"
          />

          {/* Min Point Marker */}
          <circle
            cx={points[minIdx].x}
            cy={points[minIdx].y}
            r="4"
            fill="#f43f5e"
            stroke="#ffffff"
            strokeWidth="1.5"
          />

          {/* Max Point Marker */}
          <circle
            cx={points[maxIdx].x}
            cy={points[maxIdx].y}
            r="4"
            fill="#06b6d4"
            stroke="#ffffff"
            strokeWidth="1.5"
          />

          {/* Current / Most Recent Point Marker */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="5"
            fill="#ffffff"
            stroke="#00F0FF"
            strokeWidth="2"
            className="animate-pulse"
          />

          {/* Interactive Hover Vertical Line & Cursor */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={points[hoveredIdx].x}
                y1={paddingTop}
                x2={points[hoveredIdx].x}
                y2={height - paddingBottom}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={points[hoveredIdx].x}
                cy={points[hoveredIdx].y}
                r="6"
                fill="#ffffff"
                stroke="#0284c7"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Invisible interactive hover rects */}
          {points.map((p, i) => {
            const stepW = chartWidth / data.length;
            return (
              <rect
                key={i}
                x={p.x - stepW / 2}
                y={paddingTop}
                width={stepW}
                height={chartHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredIdx(i)}
              />
            );
          })}

          {/* X-Axis Time Labels */}
          {points.map((p, i) => {
            // Show every 4th label to prevent clutter
            if (i % 4 !== 0 && i !== points.length - 1) return null;
            const timeLabel = timestamps[i] || `${24 - i}h ago`;
            return (
              <text
                key={i}
                x={p.x}
                y={height - paddingBottom + 18}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                {timeLabel}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip when hovering over a point */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-2 pointer-events-none transform -translate-x-1/2 bg-[#060D1E]/95 border border-cyan-500/50 rounded-lg p-2 text-xs font-mono shadow-xl z-20"
            style={{
              left: `${(points[hoveredIdx].x / width) * 100}%`,
            }}
          >
            <div className="text-[10px] text-cyan-400 font-semibold uppercase">
              {timestamps[hoveredIdx] || `T - ${24 - hoveredIdx} Hours`}
            </div>
            <div className="text-white font-bold text-sm">
              {data[hoveredIdx].toFixed(2)} inHg
            </div>
            <div className="text-[10px] text-slate-400">
              {data[hoveredIdx] < 29.80 ? (
                <span className="text-amber-400 font-semibold">⚠️ Trigger Zone (&lt; 29.80)</span>
              ) : (
                <span className="text-emerald-400">Stable Ambient</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Pressure Curve</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-sky-500 border-dashed" />
            <span>Standard Sea Level (29.92 inHg)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-500 border-dashed" />
            <span>Arthritis / Migraine Sensitivity Alert (&lt; 29.80)</span>
          </div>
        </div>
        <div className="text-slate-500">Hourly resolution • Source: Open-Meteo</div>
      </div>
    </div>
  );
};
