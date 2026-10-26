import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock, Users, Zap, ShieldAlert, Sliders, RefreshCw, ArrowRight } from 'lucide-react';
import FloorplanVisualizer from './FloorplanVisualizer';

export default function TriageSimulator({ presets = [] }) {
  // Simulator state parameters
  const defaultParams = {
    booked_slots: 12,
    total_scheduled: 13,
    avg_lead_days: 18.0,
    avg_age: 52.0,
    senior_ratio: 0.35,
    sched_hour: 10,
    cum_attended_today: 12.0,
    cum_workload_today: 145.0,
    prev_hour_wait: 38.0,
    prev_2h_wait: 30.0,
    prev_hour_workload: 64.0,
    rolling_3h_wait: 34.0,
    prev_day_avg_wait: 40.0,
    day_of_week: 0,
    month: 10
  };

  const [params, setParams] = useState(defaultParams);
  const [selectedPresetId, setSelectedPresetId] = useState('post-holiday-monday');
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Trigger prediction API
  const runPrediction = useCallback(async (currentParams) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentParams)
      });
      if (res.ok) {
        const data = await res.json();
        setPrediction(data);
      }
    } catch (err) {
      console.error("Failed to run prediction:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run on mount or params change
  useEffect(() => {
    const timer = setTimeout(() => {
      runPrediction(params);
    }, 150);
    return () => clearTimeout(timer);
  }, [params, runPrediction]);

  const handlePresetSelect = (preset) => {
    setSelectedPresetId(preset.id);
    setParams(preset.params);
  };

  const updateParam = (field, value) => {
    setSelectedPresetId('custom');
    setParams(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Scenario Presets Deck */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-obsidian-border/50 text-xs font-mono">
          <div className="flex items-center space-x-2 text-gray-300">
            <Zap className="w-4 h-4 text-clinical-orange" />
            <span className="font-semibold tracking-wider">REALISTIC CLINICAL SCENARIO PRESETS</span>
          </div>
          <span className="text-gray-500">SELECT TO SIMULATE COMPOSITE OPD STRESS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`text-left p-3 rounded-sm border transition-all duration-150 relative ${
                  isSelected
                    ? 'border-clinical-orange bg-clinical-orange/10 text-white'
                    : 'border-obsidian-border bg-obsidian-surface hover:bg-obsidian-hover text-gray-300'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{
                  color: preset.category.includes('Critical') || preset.category.includes('Overload')
                    ? '#FF4F00'
                    : preset.category.includes('Surplus') || preset.category.includes('Optimal')
                    ? '#00875A'
                    : '#D97706'
                }}>
                  {preset.category}
                </div>
                <div className="font-display font-semibold text-xs text-white leading-snug">
                  {preset.title}
                </div>
                <div className="text-[11px] font-mono text-gray-400 mt-1 line-clamp-2">
                  {preset.description}
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-clinical-orange" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Simulation Deck: Floorplan & Live Recommendations */}
      {prediction && (
        <FloorplanVisualizer
          isOverloaded={prediction.lstm.is_overloaded || prediction.mlp.is_overloaded}
          waitMins={prediction.lstm.predicted_wait_mins}
          queueUtilization={prediction.lstm.queue_utilization_rho}
          activeHour={params.sched_hour}
          riskCategory={prediction.overload_risk_category}
        />
      )}

      {/* Staffing Action Recommendation Banner */}
      {prediction && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-sm border font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            prediction.overload_risk_category === 'Critical Overload'
              ? 'bg-clinical-orange/10 border-clinical-orange text-orange-200'
              : prediction.overload_risk_category === 'Approaching Capacity'
              ? 'bg-clinical-amber/10 border-clinical-amber text-amber-200'
              : 'bg-clinical-emerald/10 border-clinical-emerald text-emerald-200'
          }`}
        >
          <div className="flex items-start space-x-3">
            {prediction.overload_risk_category === 'Critical Overload' ? (
              <ShieldAlert className="w-5 h-5 text-clinical-orange flex-shrink-0 mt-0.5" />
            ) : prediction.overload_risk_category === 'Approaching Capacity' ? (
              <AlertTriangle className="w-5 h-5 text-clinical-amber flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-clinical-emerald flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold tracking-wider uppercase text-[11px] flex items-center space-x-2">
                <span>TRIAGE DIRECTIVE // {prediction.overload_risk_category}</span>
                <span className="text-gray-400 font-normal">| BUFFER SLOTS RECOMMENDED: {prediction.suggested_buffer_slots}</span>
              </div>
              <div className="text-sm font-semibold text-white mt-0.5">
                {prediction.staffing_recommendation}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-right flex-shrink-0">
            <div className="px-3 py-1.5 rounded bg-black/40 border border-white/10">
              <span className="text-[10px] text-gray-400 block">EST. QUEUE BACKLOG</span>
              <span className="text-sm font-bold text-white">
                {prediction.lstm.predicted_wait_mins.toFixed(0)} mins
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Side-by-Side Model Comparison Cards */}
      {prediction && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MLP Card */}
          <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4 relative">
            <div className="flex items-center justify-between border-b border-obsidian-border/60 pb-2 mb-3">
              <div>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">MODEL 01 // FEEDFORWARD</span>
                <h3 className="font-display font-bold text-sm text-white">MULTI-LAYER PERCEPTRON (MLP)</h3>
                <span className="text-[11px] font-mono text-gray-400">Architecture: 128 -&gt; 64 -&gt; 32 (ReLU)</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                prediction.mlp.is_overloaded
                  ? 'bg-clinical-orange/20 text-clinical-orange border border-clinical-orange/40'
                  : 'bg-clinical-emerald/20 text-clinical-emerald border border-clinical-emerald/40'
              }`}>
                {prediction.mlp.is_overloaded ? 'PREDICTED OVERLOAD' : 'NOMINAL FLOW'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-4">
              <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border">
                <span className="text-[10px] font-mono text-gray-400 block">OVERLOAD PROB</span>
                <span className="text-xl font-mono font-bold text-white">
                  {(prediction.mlp.overload_probability * 100).toFixed(1)}%
                </span>
                <div className="w-full bg-obsidian-base h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-clinical-orange transition-all duration-300"
                    style={{ width: `${Math.min(prediction.mlp.overload_probability * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border">
                <span className="text-[10px] font-mono text-gray-400 block">EXPECTED WAIT</span>
                <span className="text-xl font-mono font-bold text-white">
                  {prediction.mlp.predicted_wait_mins.toFixed(0)} <span className="text-xs font-normal text-gray-400">min</span>
                </span>
                <span className="text-[10px] font-mono text-gray-500 block mt-1">Regression head</span>
              </div>

              <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border">
                <span className="text-[10px] font-mono text-gray-400 block">QUEUE UTIL (ρ)</span>
                <span className="text-xl font-mono font-bold" style={{
                  color: prediction.mlp.queue_utilization_rho > 1.0 ? '#FF4F00' : '#00875A'
                }}>
                  {prediction.mlp.queue_utilization_rho.toFixed(2)}
                </span>
                <span className="text-[10px] font-mono text-gray-500 block mt-1">
                  {prediction.mlp.queue_utilization_rho > 1.0 ? 'Capacity deficit' : 'Capacity stable'}
                </span>
              </div>
            </div>

            <p className="text-[11px] font-mono text-gray-400 border-t border-obsidian-border/40 pt-2">
              Note: Feedforward MLP treats the input as an isolated snapshot without continuous memory of early-morning bottlenecks.
            </p>
          </div>

          {/* LSTM Card */}
          <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4 relative">
            <div className="flex items-center justify-between border-b border-obsidian-border/60 pb-2 mb-3">
              <div>
                <span className="text-[10px] font-mono text-clinical-blue uppercase tracking-widest block font-bold">MODEL 02 // RECURRENT DUAL-HEAD</span>
                <h3 className="font-display font-bold text-sm text-white flex items-center space-x-2">
                  <span>LSTM SEQUENTIAL NETWORK</span>
                  <span className="text-[10px] font-mono bg-clinical-blue/20 text-clinical-blue px-1.5 py-0.2 rounded border border-clinical-blue/40">
                    PORTABLE NUMPY
                  </span>
                </h3>
                <span className="text-[11px] font-mono text-gray-400">Architecture: 32-Unit Cell + Multi-Gate Memory</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                prediction.lstm.is_overloaded
                  ? 'bg-clinical-orange/20 text-clinical-orange border border-clinical-orange/40'
                  : 'bg-clinical-emerald/20 text-clinical-emerald border border-clinical-emerald/40'
              }`}>
                {prediction.lstm.is_overloaded ? 'PREDICTED OVERLOAD' : 'NOMINAL FLOW'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-4">
              <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border">
                <span className="text-[10px] font-mono text-gray-400 block">OVERLOAD PROB</span>
                <span className="text-xl font-mono font-bold text-white">
                  {(prediction.lstm.overload_probability * 100).toFixed(1)}%
                </span>
                <div className="w-full bg-obsidian-base h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-clinical-blue transition-all duration-300"
                    style={{ width: `${Math.min(prediction.lstm.overload_probability * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border">
                <span className="text-[10px] font-mono text-gray-400 block">EXPECTED WAIT</span>
                <span className="text-xl font-mono font-bold text-white">
                  {prediction.lstm.predicted_wait_mins.toFixed(0)} <span className="text-xs font-normal text-gray-400">min</span>
                </span>
                <span className="text-[10px] font-mono text-gray-500 block mt-1">
                  Δ vs MLP: {prediction.queue_backlog_delta_mins > 0 ? `+${prediction.queue_backlog_delta_mins}m` : `${prediction.queue_backlog_delta_mins}m`}
                </span>
              </div>

              <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border">
                <span className="text-[10px] font-mono text-gray-400 block">QUEUE UTIL (ρ)</span>
                <span className="text-xl font-mono font-bold" style={{
                  color: prediction.lstm.queue_utilization_rho > 1.0 ? '#FF4F00' : '#00875A'
                }}>
                  {prediction.lstm.queue_utilization_rho.toFixed(2)}
                </span>
                <span className="text-[10px] font-mono text-gray-500 block mt-1">
                  {prediction.lstm.queue_utilization_rho > 1.0 ? 'Exceeds clinic cap' : 'Nominal throughput'}
                </span>
              </div>
            </div>

            <p className="text-[11px] font-mono text-gray-400 border-t border-obsidian-border/40 pt-2">
              Advantage: LSTM gate equations preserve cumulative intraday consult workload and previous-hour queue delays.
            </p>
          </div>
        </div>
      )}

      {/* Live LSTM Gate Telemetry Bars */}
      {prediction && prediction.lstm_gates && (
        <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-obsidian-border/60 text-xs font-mono">
            <div className="flex items-center space-x-2 text-white font-semibold">
              <span className="w-2 h-2 rounded-full bg-clinical-blue"></span>
              <span>LIVE LSTM RECURRENT GATE ACTIVATIONS &amp; CELL MEMORY (NUMPY FORWARD PASS)</span>
            </div>
            <span className="text-gray-500 text-[11px]">GATE EQUATIONS RESOLVED IN REAL-TIME (&lt;0.5ms)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
            {/* Input Gate */}
            <div className="p-2.5 bg-obsidian-surface rounded-sm border border-obsidian-border">
              <div className="flex justify-between text-gray-400 text-[10px]">
                <span>INPUT GATE (iₜ)</span>
                <span className="text-white font-bold">{prediction.lstm_gates.input_gate.toFixed(3)}</span>
              </div>
              <div className="w-full bg-obsidian-base h-2 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-clinical-blue"
                  animate={{ width: `${prediction.lstm_gates.input_gate * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[9px] text-gray-500 block mt-1">New arrival admittance</span>
            </div>

            {/* Forget Gate */}
            <div className="p-2.5 bg-obsidian-surface rounded-sm border border-obsidian-border">
              <div className="flex justify-between text-gray-400 text-[10px]">
                <span>FORGET GATE (fₜ)</span>
                <span className="text-white font-bold">{prediction.lstm_gates.forget_gate.toFixed(3)}</span>
              </div>
              <div className="w-full bg-obsidian-base h-2 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-clinical-amber"
                  animate={{ width: `${prediction.lstm_gates.forget_gate * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[9px] text-gray-500 block mt-1">Backlog retention scale</span>
            </div>

            {/* Output Gate */}
            <div className="p-2.5 bg-obsidian-surface rounded-sm border border-obsidian-border">
              <div className="flex justify-between text-gray-400 text-[10px]">
                <span>OUTPUT GATE (oₜ)</span>
                <span className="text-white font-bold">{prediction.lstm_gates.output_gate.toFixed(3)}</span>
              </div>
              <div className="w-full bg-obsidian-base h-2 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-clinical-emerald"
                  animate={{ width: `${prediction.lstm_gates.output_gate * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[9px] text-gray-500 block mt-1">Hidden state emission</span>
            </div>

            {/* Candidate Cell */}
            <div className="p-2.5 bg-obsidian-surface rounded-sm border border-obsidian-border">
              <div className="flex justify-between text-gray-400 text-[10px]">
                <span>CANDIDATE (c̃ₜ)</span>
                <span className="text-white font-bold">{prediction.lstm_gates.candidate_cell.toFixed(3)}</span>
              </div>
              <div className="w-full bg-obsidian-base h-2 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-purple-500"
                  animate={{ width: `${prediction.lstm_gates.candidate_cell * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[9px] text-gray-500 block mt-1">Hourly stimulus vector</span>
            </div>

            {/* Cell State Norm */}
            <div className="p-2.5 bg-obsidian-surface rounded-sm border border-obsidian-border">
              <div className="flex justify-between text-gray-400 text-[10px]">
                <span>CELL STATE (|cₜ|)</span>
                <span className="text-white font-bold">{prediction.lstm_gates.cell_state_norm.toFixed(3)}</span>
              </div>
              <div className="w-full bg-obsidian-base h-2 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-clinical-orange"
                  animate={{ width: `${Math.min(prediction.lstm_gates.cell_state_norm * 80, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[9px] text-gray-500 block mt-1">Cumulative intraday delay</span>
            </div>

            {/* Hidden State Norm */}
            <div className="p-2.5 bg-obsidian-surface rounded-sm border border-obsidian-border">
              <div className="flex justify-between text-gray-400 text-[10px]">
                <span>HIDDEN NORM (|hₜ|)</span>
                <span className="text-white font-bold">{prediction.lstm_gates.hidden_state_norm.toFixed(3)}</span>
              </div>
              <div className="w-full bg-obsidian-base h-2 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-cyan-400"
                  animate={{ width: `${Math.min(prediction.lstm_gates.hidden_state_norm * 120, 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[9px] text-gray-500 block mt-1">Head input representation</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Controls & Fine-Tuning Sliders Deck */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-obsidian-border/60 text-xs font-mono">
          <div className="flex items-center space-x-2 text-white font-semibold">
            <Sliders className="w-4 h-4 text-clinical-orange" />
            <span>INTERACTIVE CLINICAL SIMULATION CONTROLS &amp; PARAMETER SLIDERS</span>
          </div>
          <button
            onClick={() => setParams(defaultParams)}
            className="text-[11px] text-gray-400 hover:text-white flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>RESET TO DEFAULT</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {/* Scheduled Hour */}
          <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border/80">
            <div className="flex justify-between mb-1.5">
              <label className="text-gray-400 text-[11px]">OPERATING HOUR</label>
              <span className="text-white font-bold">{String(params.sched_hour).padStart(2, '0')}:00</span>
            </div>
            <input
              type="range"
              min="8"
              max="17"
              step="1"
              value={params.sched_hour}
              onChange={(e) => updateParam('sched_hour', parseInt(e.target.value))}
              className="w-full accent-clinical-orange bg-obsidian-base h-1.5 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>08:00 (Open)</span>
              <span>17:00 (Close)</span>
            </div>
          </div>

          {/* Booked Slots */}
          <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border/80">
            <div className="flex justify-between mb-1.5">
              <label className="text-gray-400 text-[11px]">BOOKED SLOTS</label>
              <span className="text-white font-bold">{params.booked_slots} slots</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="1"
              value={params.booked_slots}
              onChange={(e) => updateParam('booked_slots', parseInt(e.target.value))}
              className="w-full accent-clinical-orange bg-obsidian-base h-1.5 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>0 (Empty)</span>
              <span>24 (Max)</span>
            </div>
          </div>

          {/* Senior Ratio */}
          <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border/80">
            <div className="flex justify-between mb-1.5">
              <label className="text-gray-400 text-[11px]">SENIOR RATIO (60+)</label>
              <span className="text-white font-bold">{(params.senior_ratio * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={params.senior_ratio}
              onChange={(e) => updateParam('senior_ratio', parseFloat(e.target.value))}
              className="w-full accent-clinical-orange bg-obsidian-base h-1.5 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>0% Young</span>
              <span>100% Geriatric</span>
            </div>
          </div>

          {/* Previous Hour Wait */}
          <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border/80">
            <div className="flex justify-between mb-1.5">
              <label className="text-gray-400 text-[11px]">PREV HOUR WAIT</label>
              <span className="text-white font-bold">{params.prev_hour_wait.toFixed(0)} mins</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="2"
              value={params.prev_hour_wait}
              onChange={(e) => updateParam('prev_hour_wait', parseFloat(e.target.value))}
              className="w-full accent-clinical-orange bg-obsidian-base h-1.5 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>0 min</span>
              <span>120 min</span>
            </div>
          </div>

          {/* Prev Hour Workload */}
          <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border/80">
            <div className="flex justify-between mb-1.5">
              <label className="text-gray-400 text-[11px]">PREV HOUR WORKLOAD</label>
              <span className="text-white font-bold">{params.prev_hour_workload.toFixed(0)} mins</span>
            </div>
            <input
              type="range"
              min="0"
              max="140"
              step="5"
              value={params.prev_hour_workload}
              onChange={(e) => updateParam('prev_hour_workload', parseFloat(e.target.value))}
              className="w-full accent-clinical-orange bg-obsidian-base h-1.5 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>0 min</span>
              <span>140 min</span>
            </div>
          </div>

          {/* Cumulative Workload Today */}
          <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border/80">
            <div className="flex justify-between mb-1.5">
              <label className="text-gray-400 text-[11px]">CUMULATIVE WORKLOAD</label>
              <span className="text-white font-bold">{params.cum_workload_today.toFixed(0)} mins</span>
            </div>
            <input
              type="range"
              min="0"
              max="600"
              step="15"
              value={params.cum_workload_today}
              onChange={(e) => updateParam('cum_workload_today', parseFloat(e.target.value))}
              className="w-full accent-clinical-orange bg-obsidian-base h-1.5 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>0 min (Start)</span>
              <span>600 min</span>
            </div>
          </div>

          {/* Rolling 3h Wait */}
          <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border/80">
            <div className="flex justify-between mb-1.5">
              <label className="text-gray-400 text-[11px]">ROLLING 3H WAIT</label>
              <span className="text-white font-bold">{params.rolling_3h_wait.toFixed(0)} mins</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="2"
              value={params.rolling_3h_wait}
              onChange={(e) => updateParam('rolling_3h_wait', parseFloat(e.target.value))}
              className="w-full accent-clinical-orange bg-obsidian-base h-1.5 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>0 min</span>
              <span>120 min</span>
            </div>
          </div>

          {/* Prev Day Avg Wait */}
          <div className="p-3 bg-obsidian-surface rounded-sm border border-obsidian-border/80">
            <div className="flex justify-between mb-1.5">
              <label className="text-gray-400 text-[11px]">YESTERDAY AVG WAIT</label>
              <span className="text-white font-bold">{params.prev_day_avg_wait.toFixed(0)} mins</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="2"
              value={params.prev_day_avg_wait}
              onChange={(e) => updateParam('prev_day_avg_wait', parseFloat(e.target.value))}
              className="w-full accent-clinical-orange bg-obsidian-base h-1.5 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>0 min</span>
              <span>100 min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
