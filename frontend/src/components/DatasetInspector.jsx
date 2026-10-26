import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Filter, Clock, BarChart3, Shield, ArrowDown, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function DatasetInspector({ telemetry, isMobile = false }) {
  const [selectedClockHour, setSelectedClockHour] = useState(10);

  if (!telemetry || !telemetry.metadata) {
    return <div className="p-8 text-center font-mono text-gray-500">Loading dataset telemetry...</div>;
  }

  const { metadata, hourly_bottlenecks = [], insurance_providers = [], feature_importance = [] } = telemetry;

  // Cyclical calculation for selected hour
  const hourRad = (2 * Math.PI * selectedClockHour) / 24.0;
  const hourSin = Math.sin(hourRad);
  const hourCos = Math.cos(hourRad);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {/* Pipeline Transformation Banner */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3 pb-2 sm:pb-3 mb-3 sm:mb-4 border-b border-obsidian-border/60">
          <div>
            <span className="text-[10px] font-mono text-clinical-emerald uppercase tracking-widest block font-bold">
              DATA ARCHITECTURE
            </span>
            <h2 className="font-display font-bold text-base sm:text-lg text-white">
              RAW DATASETS &rarr; 26,090 HOURLY OPD BUCKETS
            </h2>
            <p className="text-[11px] sm:text-xs font-mono text-gray-400 mt-0.5">
              Deterministic aggregation across 2,609 clinic days and 10 operating hours (08:00 to 17:00).
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="px-2 py-0.5 rounded bg-obsidian-surface border border-obsidian-border text-gray-300 text-[11px]">
              TENSORS: <span className="text-white font-bold">26,090 ROWS</span>
            </span>
          </div>
        </div>

        {/* Pipeline Stage Cards - 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 font-mono text-xs">
          <div className="p-2.5 sm:p-3 bg-obsidian-surface border border-obsidian-border rounded-sm">
            <div className="flex justify-between text-gray-400 text-[9px]">
              <span>INPUT 1</span>
              <span className="text-white font-bold">CSV</span>
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-white mt-0.5 truncate">appointments.csv</div>
            <div className="text-base sm:text-xl font-bold text-clinical-orange mt-0.5">
              {metadata.dataset_rows.raw_appointments.toLocaleString()}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">16 fields: check-in, wait</div>
          </div>

          <div className="p-2.5 sm:p-3 bg-obsidian-surface border border-obsidian-border rounded-sm">
            <div className="flex justify-between text-gray-400 text-[9px]">
              <span>INPUT 2</span>
              <span className="text-white font-bold">CSV</span>
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-white mt-0.5 truncate">slots.csv</div>
            <div className="text-base sm:text-xl font-bold text-clinical-blue mt-0.5">
              {metadata.dataset_rows.raw_slots.toLocaleString()}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">4 fields: 15-min slots</div>
          </div>

          <div className="p-2.5 sm:p-3 bg-obsidian-surface border border-obsidian-border rounded-sm">
            <div className="flex justify-between text-gray-400 text-[9px]">
              <span>INPUT 3</span>
              <span className="text-white font-bold">CSV</span>
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-white mt-0.5 truncate">patients.csv</div>
            <div className="text-base sm:text-xl font-bold text-clinical-emerald mt-0.5">
              {metadata.dataset_rows.raw_patients.toLocaleString()}
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">5 fields: age, insurance</div>
          </div>

          <div className="p-2.5 sm:p-3 bg-obsidian-surface border border-clinical-orange/40 rounded-sm">
            <div className="flex justify-between text-clinical-orange text-[9px]">
              <span>BUCKETS</span>
              <span className="font-bold">MATRIX</span>
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-white mt-0.5 truncate">hourly_opd_matrix</div>
            <div className="text-base sm:text-xl font-bold text-white mt-0.5">
              {metadata.dataset_rows.hourly_buckets.toLocaleString()}
            </div>
            <div className="text-[9px] text-gray-400 mt-0.5">19 features + 2 targets</div>
          </div>
        </div>
      </div>

      {/* Cyclical Temporal Encoding Visualizer & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Cyclical Sin/Cos Clock Encoder (5 cols) */}
        <div className="lg:col-span-5 bg-obsidian-panel border border-obsidian-border rounded-sm p-3 sm:p-4">
          <div className="flex items-center justify-between pb-2 mb-2 sm:pb-3 sm:mb-3 border-b border-obsidian-border/60 text-xs font-mono">
            <span className="font-semibold text-white text-[11px] sm:text-xs">CYCLICAL CLOCK ENCODING</span>
            <span className="text-clinical-orange text-[10px] font-bold">24H MAP</span>
          </div>

          <p className="text-[11px] font-mono text-gray-400 mb-3">
            Preserves continuous circular distance between consecutive hours across midnight.
          </p>

          {/* Interactive Clock Slider */}
          <div className="bg-obsidian-surface p-2.5 rounded-sm border border-obsidian-border font-mono text-xs mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-[10px]">HOUR:</span>
              <span className="font-bold text-white">{String(selectedClockHour).padStart(2, '0')}:00</span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              step="1"
              value={selectedClockHour}
              onChange={(e) => setSelectedClockHour(parseInt(e.target.value))}
              className="touch-slider w-full accent-clinical-orange"
            />
          </div>

          {/* Radial Clock SVG */}
          <div className="flex items-center justify-center py-1">
            <svg width="180" height="180" viewBox="-110 -110 220 220" className="font-mono text-[9px] select-none max-w-full">
              <circle cx="0" cy="0" r="95" fill="#12151B" stroke="#282D37" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="2" fill="#64748B" />

              {/* 24-hour hour tick marks */}
              {Array.from({ length: 24 }).map((_, h) => {
                const angle = (2 * Math.PI * h) / 24.0 - Math.PI / 2;
                const tx = Math.cos(angle) * 82;
                const ty = Math.sin(angle) * 82;
                const isOp = h >= 8 && h <= 17;
                return (
                  <text
                    key={h}
                    x={tx}
                    y={ty + 3}
                    textAnchor="middle"
                    fill={h === selectedClockHour ? '#FF4F00' : isOp ? '#E2E8F0' : '#475569'}
                    fontWeight={h === selectedClockHour ? 'bold' : 'normal'}
                    fontSize={h === selectedClockHour ? '11' : '8.5'}
                  >
                    {h}
                  </text>
                );
              })}

              {/* Active Hour Ray Vector */}
              {(() => {
                const angle = (2 * Math.PI * selectedClockHour) / 24.0 - Math.PI / 2;
                const rx = Math.cos(angle) * 70;
                const ry = Math.sin(angle) * 70;
                return (
                  <>
                    <line x1="0" y1="0" x2={rx} y2={ry} stroke="#FF4F00" strokeWidth="2" strokeLinecap="round" />
                    <circle cx={rx} cy={ry} r="4" fill="#FF4F00" stroke="#FFFFFF" strokeWidth="1.2" />
                  </>
                );
              })()}
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
            <div className="p-2 bg-obsidian-surface border border-obsidian-border rounded-sm">
              <span className="text-[9px] text-gray-500 block truncate">sin(2π·h/24)</span>
              <span className="text-sm font-bold text-white block mt-0.5">{hourSin.toFixed(4)}</span>
            </div>
            <div className="p-2 bg-obsidian-surface border border-obsidian-border rounded-sm">
              <span className="text-[9px] text-gray-500 block truncate">cos(2π·h/24)</span>
              <span className="text-sm font-bold text-white block mt-0.5">{hourCos.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Right: Feature Importance Rankings (7 cols) */}
        <div className="lg:col-span-7 bg-obsidian-panel border border-obsidian-border rounded-sm p-3 sm:p-4 overflow-x-auto">
          <div className="flex items-center justify-between pb-2 mb-2 sm:pb-3 sm:mb-3 border-b border-obsidian-border/60 text-xs font-mono">
            <span className="font-semibold text-white text-[11px] sm:text-xs">FEATURE IMPORTANCE RANKINGS</span>
            <span className="text-gray-500 text-[10px]">LAYER WEIGHTS</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {feature_importance.map((item, idx) => {
              const pct = (item.importance * 100).toFixed(1);
              return (
                <div key={item.feature} className="space-y-1">
                  <div className="flex justify-between text-gray-300 text-[10px] sm:text-[11px]">
                    <span className="flex items-center space-x-1.5 truncate">
                      <span className="text-gray-500 text-[9px] w-3.5">{String(idx + 1).padStart(2, '0')}.</span>
                      <span className="font-semibold text-white truncate">{item.feature}</span>
                    </span>
                    <span className="text-gray-400 font-bold ml-2">{pct}%</span>
                  </div>
                  <div className="w-full bg-obsidian-surface h-1.5 rounded-full overflow-hidden border border-obsidian-border/60">
                    <div
                      className="h-full bg-clinical-orange rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(item.importance * 350, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hourly Bottleneck Congestion Distribution (08:00 to 17:00) */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-obsidian-border/60 text-xs font-mono gap-1">
          <div className="flex items-center space-x-1.5 text-white font-semibold">
            <BarChart3 className="w-3.5 h-3.5 text-clinical-amber" />
            <span className="text-[11px] sm:text-xs">HOURLY BOTTLENECK PROFILE (08:00 TO 17:00)</span>
          </div>
          <span className="text-gray-500 text-[10px]">PEAK CONGESTION 10:00 - 14:00</span>
        </div>

        <div className="w-full" style={{ height: isMobile ? 220 : 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourly_bottlenecks} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252A36" />
              <XAxis dataKey="hour_label" stroke="#64748B" tick={{ fontSize: isMobile ? 9 : 11, fontFamily: 'monospace' }} />
              <YAxis stroke="#64748B" tick={{ fontSize: isMobile ? 9 : 11, fontFamily: 'monospace' }} unit="m" />
              <Tooltip
                formatter={(val, name) => [`${val} mins`, 'Mean Wait Time']}
                labelFormatter={(lbl) => `Operating Hour: ${lbl}`}
                contentStyle={{ backgroundColor: '#161922', border: '1px solid #282D37', fontSize: '10px', fontFamily: 'monospace' }}
              />
              <Bar dataKey="avg_wait_mins" name="Average Wait" fill="#FF4F00" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insurance Provider Demographic Breakdown */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-3 sm:p-4 overflow-x-auto">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-obsidian-border/60 text-xs font-mono">
          <span className="font-semibold text-white text-[11px] sm:text-xs">INSURANCE PAYOR TELEMETRY</span>
          <span className="text-gray-500 text-[10px]">11 PAYORS (SCROLL &rarr;)</span>
        </div>

        <div className="min-w-[540px]">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-obsidian-border text-gray-400 text-[10px] uppercase">
                <th className="py-2 px-2.5">Provider</th>
                <th className="py-2 px-2.5 text-right">Appts</th>
                <th className="py-2 px-2.5 text-right">Attended</th>
                <th className="py-2 px-2.5 text-right">Cancel Rate</th>
                <th className="py-2 px-2.5 text-right">Avg Wait</th>
                <th className="py-2 px-2.5 text-right">Avg Dur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-border/40">
              {insurance_providers.map((ins) => (
                <tr key={ins.provider} className="hover:bg-obsidian-hover transition-colors text-gray-300">
                  <td className="py-2 px-2.5 font-semibold text-white text-[11px]">{ins.provider}</td>
                  <td className="py-2 px-2.5 text-right">{ins.total_appointments.toLocaleString()}</td>
                  <td className="py-2 px-2.5 text-right text-clinical-emerald font-bold">{ins.attended_count.toLocaleString()}</td>
                  <td className="py-2 px-2.5 text-right font-mono">{(ins.cancellation_rate * 100).toFixed(1)}%</td>
                  <td className="py-2 px-2.5 text-right text-clinical-orange font-bold">{ins.avg_wait_mins.toFixed(1)}m</td>
                  <td className="py-2 px-2.5 text-right">{ins.avg_duration_mins.toFixed(1)}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
