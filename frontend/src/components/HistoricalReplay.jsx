import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Calendar, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import FloorplanVisualizer from './FloorplanVisualizer';

export default function HistoricalReplay({ replayDays = [] }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [activeHourIndex, setActiveHourIndex] = useState(2); // default 10:00 AM (index 2)
  const [isPlaying, setIsPlaying] = useState(false);

  // Set initial selected date
  useEffect(() => {
    if (replayDays.length > 0 && !selectedDate) {
      setSelectedDate(replayDays[0].date);
    }
  }, [replayDays, selectedDate]);

  // Find active day
  const currentDay = replayDays.find(d => d.date === selectedDate) || replayDays[0];

  // Auto-play timeline loop
  useEffect(() => {
    let interval;
    if (isPlaying && currentDay) {
      interval = setInterval(() => {
        setActiveHourIndex(prev => {
          if (prev >= currentDay.hours.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentDay]);

  if (!currentDay) {
    return <div className="p-8 text-center font-mono text-gray-500">Loading historical test replay archive...</div>;
  }

  const activeHourData = currentDay.hours[activeHourIndex] || currentDay.hours[0];

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-obsidian-surface border border-obsidian-border p-3 rounded-sm font-mono text-xs shadow-xl">
          <div className="font-bold text-white border-b border-obsidian-border/60 pb-1 mb-1.5">
            Hour: {label}
          </div>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between space-x-4 py-0.5" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span className="font-bold">{entry.value} min</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Date Selector & Playback Control Bar */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-clinical-blue uppercase tracking-widest block font-bold">
              2024 TEST SET GROUND TRUTH ARCHIVE
            </span>
            <h2 className="font-display font-bold text-lg text-white flex items-center space-x-2">
              <span>HISTORICAL CLINIC DAY REPLAY ENGINE</span>
            </h2>
            <p className="text-xs font-mono text-gray-400 mt-0.5">
              Select an authentic operating date from the 2024 chronological test holdout (never seen during training).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Select Dropdown */}
            <div className="flex items-center space-x-2 bg-obsidian-surface border border-obsidian-border rounded-sm px-3 py-1.5 font-mono text-xs">
              <Calendar className="w-4 h-4 text-clinical-orange" />
              <select
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setActiveHourIndex(0);
                  setIsPlaying(false);
                }}
                className="bg-transparent text-white outline-none cursor-pointer"
              >
                {replayDays.map((d) => (
                  <option key={d.date} value={d.date} className="bg-obsidian-surface text-white">
                    {d.date} ({d.day_of_week}) — {d.total_day_attended} attended, avg {d.avg_day_wait}m
                  </option>
                ))}
              </select>
            </div>

            {/* Play / Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-sm font-mono text-xs font-semibold bg-clinical-orange text-black hover:bg-orange-600 transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
              <span>{isPlaying ? 'PAUSE TIMELINE' : 'PLAY REPLAY'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={() => {
                setActiveHourIndex(0);
                setIsPlaying(false);
              }}
              className="p-1.5 rounded-sm border border-obsidian-border text-gray-400 hover:text-white"
              title="Reset to 08:00 AM"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timeline Hour Scrubbing Bar */}
        <div className="mt-5 pt-4 border-t border-obsidian-border/60">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-gray-400">SCRUBBING TIMELINE:</span>
            <span className="font-bold text-white flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-clinical-orange" />
              <span>{activeHourData.hour_label}</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded ${
                activeHourData.actual_overloaded
                  ? 'bg-clinical-orange/20 text-clinical-orange border border-clinical-orange/40'
                  : 'bg-clinical-emerald/20 text-clinical-emerald border border-clinical-emerald/40'
              }`}>
                {activeHourData.actual_overloaded ? 'HISTORICAL OVERLOAD' : 'NOMINAL CAPACITY'}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-10 gap-1.5">
            {currentDay.hours.map((h, idx) => {
              const isSelected = activeHourIndex === idx;
              return (
                <button
                  key={h.sched_hour}
                  onClick={() => {
                    setActiveHourIndex(idx);
                    setIsPlaying(false);
                  }}
                  className={`py-2 px-1 text-center font-mono rounded-sm border transition-all text-xs ${
                    isSelected
                      ? 'border-clinical-orange bg-clinical-orange/20 text-white font-bold ring-1 ring-clinical-orange'
                      : h.actual_overloaded
                      ? 'border-clinical-orange/30 bg-clinical-orange/5 text-gray-300 hover:bg-clinical-orange/10'
                      : 'border-obsidian-border bg-obsidian-surface text-gray-400 hover:bg-obsidian-hover'
                  }`}
                >
                  <div className="text-[10px]">{h.hour_label}</div>
                  <div className={`text-[11px] font-bold mt-0.5 ${h.actual_overloaded ? 'text-clinical-orange' : 'text-clinical-emerald'}`}>
                    {h.actual_wait_mins.toFixed(0)}m
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Synchronized Floorplan for Active Scrubbed Hour */}
      <FloorplanVisualizer
        isOverloaded={Boolean(activeHourData.actual_overloaded)}
        waitMins={activeHourData.actual_wait_mins}
        queueUtilization={activeHourData.actual_wait_mins / 45.0}
        activeHour={activeHourData.sched_hour}
        riskCategory={activeHourData.actual_overloaded ? 'Critical Overload' : 'Nominal Flow'}
      />

      {/* Hourly Curves: Actual vs MLP vs LSTM */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-obsidian-border/60 text-xs font-mono gap-2">
          <div className="flex items-center space-x-2 text-white font-semibold">
            <TrendingUp className="w-4 h-4 text-clinical-blue" />
            <span>HOURLY WAIT-TIME PROGRESSION // ACTUAL VS. MLP VS. LSTM</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-gray-200 inline-block"></span>
              <span className="text-gray-300">Ground Truth Actual</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-[#FF4F00] inline-block"></span>
              <span className="text-[#FF4F00]">MLP Predicted</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-[#0284C7] inline-block"></span>
              <span className="text-[#0284C7]">LSTM Sequential</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currentDay.hours} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252A36" />
              <XAxis dataKey="hour_label" stroke="#64748B" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11, fontFamily: 'monospace' }} unit="m" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={45} stroke="#FF4F00" strokeDasharray="3 3" label={{ value: 'Overload Cap (45m)', fill: '#FF4F00', fontSize: 10, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="actual_wait_mins" name="Actual Wait" stroke="#F1F5F9" strokeWidth={2.5} dot={{ r: 3, fill: '#F1F5F9' }} />
              <Line type="monotone" dataKey="mlp_pred_wait_mins" name="MLP Predicted" stroke="#FF4F00" strokeWidth={1.8} strokeDasharray="4 4" dot={{ r: 2.5, fill: '#FF4F00' }} />
              <Line type="monotone" dataKey="lstm_pred_wait_mins" name="LSTM Predicted" stroke="#0284C7" strokeWidth={2} dot={{ r: 3, fill: '#0284C7' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comprehensive Hour-by-Hour Ground Truth Telemetry Table */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4 overflow-x-auto">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-obsidian-border/60 text-xs font-mono">
          <span className="font-semibold text-white">HOUR-BY-HOUR AUDIT TRAIL // {currentDay.date} ({currentDay.day_of_week})</span>
          <span className="text-gray-500 text-[11px]">ALL 10 OPERATING HOURS (08:00 - 17:00)</span>
        </div>

        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-obsidian-border text-gray-400 text-[10px] uppercase">
              <th className="py-2 px-3">Hour</th>
              <th className="py-2 px-3">Booked Slots</th>
              <th className="py-2 px-3">Scheduled</th>
              <th className="py-2 px-3">Attended</th>
              <th className="py-2 px-3">No-Shows</th>
              <th className="py-2 px-3 text-right">Actual Wait</th>
              <th className="py-2 px-3 text-right">MLP Wait</th>
              <th className="py-2 px-3 text-right">LSTM Wait</th>
              <th className="py-2 px-3 text-center">Ground Truth</th>
              <th className="py-2 px-3 text-center">LSTM Proba</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-border/40">
            {currentDay.hours.map((row, idx) => {
              const isSelected = activeHourIndex === idx;
              return (
                <tr
                  key={row.sched_hour}
                  onClick={() => setActiveHourIndex(idx)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-clinical-orange/15 font-semibold text-white' : 'hover:bg-obsidian-hover text-gray-300'
                  }`}
                >
                  <td className="py-2.5 px-3">{row.hour_label}</td>
                  <td className="py-2.5 px-3">{row.booked_slots}</td>
                  <td className="py-2.5 px-3">{row.total_scheduled}</td>
                  <td className="py-2.5 px-3 text-clinical-emerald font-bold">{row.attended_count}</td>
                  <td className="py-2.5 px-3 text-gray-500">{row.no_show_count}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-white">{row.actual_wait_mins.toFixed(1)}m</td>
                  <td className="py-2.5 px-3 text-right text-clinical-orange">{row.mlp_pred_wait_mins.toFixed(1)}m</td>
                  <td className="py-2.5 px-3 text-right text-clinical-blue font-bold">{row.lstm_pred_wait_mins.toFixed(1)}m</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.actual_overloaded
                        ? 'bg-clinical-orange/20 text-clinical-orange border border-clinical-orange/40'
                        : 'bg-clinical-emerald/20 text-clinical-emerald border border-clinical-emerald/40'
                    }`}>
                      {row.actual_overloaded ? 'OVERLOAD' : 'NOMINAL'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {(row.lstm_overload_prob * 100).toFixed(0)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
