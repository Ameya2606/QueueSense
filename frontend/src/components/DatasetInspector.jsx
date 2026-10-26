import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Filter, Clock, BarChart3, Shield, ArrowDown, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function DatasetInspector({ telemetry }) {
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
    <div className="space-y-6">
      {/* Pipeline Transformation Banner */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-4 border-b border-obsidian-border/60">
          <div>
            <span className="text-[10px] font-mono text-clinical-emerald uppercase tracking-widest block font-bold">
              DATA ARCHITECTURE &amp; FEATURE PIPELINE
            </span>
            <h2 className="font-display font-bold text-lg text-white">
              RAW RELATIONAL DATASETS &rarr; 26,090 HOURLY OPD BUCKETS
            </h2>
            <p className="text-xs font-mono text-gray-400 mt-0.5">
              Automated deterministic aggregation across 2,609 unique operational clinic days and 10 operating hours (08:00 to 17:00).
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded bg-obsidian-surface border border-obsidian-border text-gray-300">
              AGGREGATED UNITS: <span className="text-white font-bold">26,090 ROWS</span>
            </span>
          </div>
        </div>

        {/* Pipeline Stage Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 bg-obsidian-surface border border-obsidian-border rounded-sm">
            <div className="flex justify-between text-gray-400 text-[10px]">
              <span>RAW DATASET 1</span>
              <span className="text-white font-bold">CSV</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">appointments.csv</div>
            <div className="text-xl font-bold text-clinical-orange mt-1">
              {metadata.dataset_rows.raw_appointments.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              16 fields: check-in, duration, wait times, patient status
            </div>
          </div>

          <div className="p-3 bg-obsidian-surface border border-obsidian-border rounded-sm">
            <div className="flex justify-between text-gray-400 text-[10px]">
              <span>RAW DATASET 2</span>
              <span className="text-white font-bold">CSV</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">slots.csv</div>
            <div className="text-xl font-bold text-clinical-blue mt-1">
              {metadata.dataset_rows.raw_slots.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              4 fields: 15-min scheduled clinic slots &amp; availability
            </div>
          </div>

          <div className="p-3 bg-obsidian-surface border border-obsidian-border rounded-sm">
            <div className="flex justify-between text-gray-400 text-[10px]">
              <span>RAW DATASET 3</span>
              <span className="text-white font-bold">CSV</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">patients.csv</div>
            <div className="text-xl font-bold text-clinical-emerald mt-1">
              {metadata.dataset_rows.raw_patients.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              5 fields: DOB, sex, and 11 distinct insurance providers
            </div>
          </div>

          <div className="p-3 bg-obsidian-surface border border-clinical-orange/40 rounded-sm">
            <div className="flex justify-between text-clinical-orange text-[10px]">
              <span>ENGINEERED BUCKETS</span>
              <span className="font-bold">ML TENSOR</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">hourly_opd_matrix</div>
            <div className="text-xl font-bold text-white mt-1">
              {metadata.dataset_rows.hourly_buckets.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              19 engineered features + 2 dual targets (wait + overload)
            </div>
          </div>
        </div>
      </div>

      {/* Cyclical Temporal Encoding Visualizer & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cyclical Sin/Cos Clock Encoder (5 cols) */}
        <div className="lg:col-span-5 bg-obsidian-panel border border-obsidian-border rounded-sm p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-obsidian-border/60 text-xs font-mono">
            <span className="font-semibold text-white">CYCLICAL CLOCK ENCODING // sin / cos</span>
            <span className="text-clinical-orange text-[11px] font-bold">24-HOUR RADIAL MAP</span>
          </div>

          <p className="text-xs font-mono text-gray-400 mb-4">
            Prevents artificial step discontinuities across midnight and preserves continuous circular distance between consecutive hours.
          </p>

          {/* Interactive Clock Slider */}
          <div className="bg-obsidian-surface p-3 rounded-sm border border-obsidian-border font-mono text-xs mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">TEST OPERATING HOUR:</span>
              <span className="font-bold text-white">{String(selectedClockHour).padStart(2, '0')}:00</span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              step="1"
              value={selectedClockHour}
              onChange={(e) => setSelectedClockHour(parseInt(e.target.value))}
              className="w-full accent-clinical-orange bg-obsidian-base h-1.5 rounded cursor-pointer"
            />
          </div>

          {/* Radial Clock SVG */}
          <div className="flex items-center justify-center py-2">
            <svg width="220" height="220" viewBox="-110 -110 220 220" className="font-mono text-[9px] select-none">
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

          <div className="grid grid-cols-2 gap-2 mt-3 font-mono text-xs">
            <div className="p-2.5 bg-obsidian-surface border border-obsidian-border rounded-sm">
              <span className="text-[10px] text-gray-500 block">hour_sin = sin(2π·h/24)</span>
              <span className="text-base font-bold text-white block mt-0.5">{hourSin.toFixed(4)}</span>
            </div>
            <div className="p-2.5 bg-obsidian-surface border border-obsidian-border rounded-sm">
              <span className="text-[10px] text-gray-500 block">hour_cos = cos(2π·h/24)</span>
              <span className="text-base font-bold text-white block mt-0.5">{hourCos.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Right: Feature Importance Rankings (7 cols) */}
        <div className="lg:col-span-7 bg-obsidian-panel border border-obsidian-border rounded-sm p-4 overflow-x-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-obsidian-border/60 text-xs font-mono">
            <span className="font-semibold text-white">ENGINEERED FEATURE IMPORTANCE // RANKED WEIGHTS</span>
            <span className="text-gray-500 text-[11px]">NORM. ABSOLUTE LAYER COEFFICIENTS</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {feature_importance.map((item, idx) => {
              const pct = (item.importance * 100).toFixed(1);
              return (
                <div key={item.feature} className="space-y-1">
                  <div className="flex justify-between text-gray-300 text-[11px]">
                    <span className="flex items-center space-x-2">
                      <span className="text-gray-500 text-[10px] w-4">{String(idx + 1).padStart(2, '0')}.</span>
                      <span className="font-semibold text-white">{item.feature}</span>
                    </span>
                    <span className="text-gray-400 font-bold">{pct}%</span>
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
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-obsidian-border/60 text-xs font-mono gap-2">
          <div className="flex items-center space-x-2 text-white font-semibold">
            <BarChart3 className="w-4 h-4 text-clinical-amber" />
            <span>HOURLY CLINIC OVERLOAD BOTTLENECK PROFILE (08:00 TO 17:00 ACROSS 10-YEAR ARCHIVE)</span>
          </div>
          <span className="text-gray-500 text-[11px]">PEAK CONGESTION OCCURS BETWEEN 10:00 AND 14:00</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourly_bottlenecks} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252A36" />
              <XAxis dataKey="hour_label" stroke="#64748B" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11, fontFamily: 'monospace' }} unit="m" />
              <Tooltip
                formatter={(val, name) => [`${val} mins`, name === 'avg_wait_mins' ? 'Mean Wait Time' : 'Mean Duration']}
                labelFormatter={(lbl) => `Operating Hour: ${lbl}`}
                contentStyle={{ backgroundColor: '#161922', border: '1px solid #282D37', fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Bar dataKey="avg_wait_mins" name="Average Patient Wait" fill="#FF4F00" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insurance Provider Demographic Breakdown */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4 overflow-x-auto">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-obsidian-border/60 text-xs font-mono">
          <span className="font-semibold text-white">PATIENT INSURANCE COVERAGE &amp; WAIT-TIME TELEMETRY</span>
          <span className="text-gray-500 text-[11px]">ALL 11 REGISTERED PAYOR PROVIDERS</span>
        </div>

        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-obsidian-border text-gray-400 text-[10px] uppercase">
              <th className="py-2 px-3">Insurance Payor Provider</th>
              <th className="py-2 px-3 text-right">Total Appointments</th>
              <th className="py-2 px-3 text-right">Attended</th>
              <th className="py-2 px-3 text-right">Cancelled</th>
              <th className="py-2 px-3 text-right">No-Shows</th>
              <th className="py-2 px-3 text-right">Cancellation Rate</th>
              <th className="py-2 px-3 text-right">Average Wait</th>
              <th className="py-2 px-3 text-right">Avg Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-border/40">
            {insurance_providers.map((ins) => (
              <tr key={ins.provider} className="hover:bg-obsidian-hover transition-colors text-gray-300">
                <td className="py-2.5 px-3 font-semibold text-white">{ins.provider}</td>
                <td className="py-2.5 px-3 text-right">{ins.total_appointments.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right text-clinical-emerald font-bold">{ins.attended_count.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right text-gray-400">{ins.cancelled_count.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right text-gray-500">{ins.no_show_count.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-right font-mono">{(ins.cancellation_rate * 100).toFixed(1)}%</td>
                <td className="py-2.5 px-3 text-right text-clinical-orange font-bold">{ins.avg_wait_mins.toFixed(1)}m</td>
                <td className="py-2.5 px-3 text-right">{ins.avg_duration_mins.toFixed(1)}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
