import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, GitCommit, Layers, Cpu, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

export default function ModelBenchmarkLab({ metrics, metadata, isMobile = false }) {
  const [activeMatrixTab, setActiveMatrixTab] = useState('lstm');

  if (!metrics || !metrics.mlp || !metrics.lstm) {
    return <div className="p-8 text-center font-mono text-gray-500">Loading benchmark evaluation matrix...</div>;
  }

  const { mlp, lstm } = metrics;

  // Format ROC curve for Recharts
  const rocData = [];
  const minLen = Math.min(mlp.roc_curve.length, lstm.roc_curve.length);
  for (let i = 0; i < minLen; i++) {
    rocData.push({
      fpr: mlp.roc_curve[i].fpr,
      mlp_tpr: mlp.roc_curve[i].tpr,
      lstm_tpr: lstm.roc_curve[i].tpr,
      random: mlp.roc_curve[i].fpr
    });
  }

  // Metrics comparison table rows
  const comparisonRows = [
    { name: 'Accuracy', mlp: (mlp.accuracy * 100).toFixed(2) + '%', lstm: (lstm.accuracy * 100).toFixed(2) + '%', delta: ((lstm.accuracy - mlp.accuracy) * 100).toFixed(2) + '%', positive: lstm.accuracy >= mlp.accuracy },
    { name: 'Precision', mlp: (mlp.precision * 100).toFixed(2) + '%', lstm: (lstm.precision * 100).toFixed(2) + '%', delta: ((lstm.precision - mlp.precision) * 100).toFixed(2) + '%', positive: lstm.precision >= mlp.precision },
    { name: 'Recall / Sens.', mlp: (mlp.recall * 100).toFixed(2) + '%', lstm: (lstm.recall * 100).toFixed(2) + '%', delta: ((lstm.recall - mlp.recall) * 100).toFixed(2) + '%', positive: lstm.recall >= mlp.recall },
    { name: 'F1 Score', mlp: mlp.f1_score.toFixed(4), lstm: lstm.f1_score.toFixed(4), delta: (lstm.f1_score - mlp.f1_score).toFixed(4), positive: lstm.f1_score >= mlp.f1_score },
    { name: 'ROC-AUC', mlp: mlp.roc_auc.toFixed(4), lstm: lstm.roc_auc.toFixed(4), delta: (lstm.roc_auc - mlp.roc_auc).toFixed(4), positive: lstm.roc_auc >= mlp.roc_auc },
    { name: 'MAE Error', mlp: mlp.mae.toFixed(2) + 'm', lstm: lstm.mae.toFixed(2) + 'm', delta: (lstm.mae - mlp.mae).toFixed(2) + 'm', positive: lstm.mae <= mlp.mae },
    { name: 'RMSE Error', mlp: mlp.rmse.toFixed(2) + 'm', lstm: lstm.rmse.toFixed(2) + 'm', delta: (lstm.rmse - mlp.rmse).toFixed(2) + 'm', positive: lstm.rmse <= mlp.rmse },
    { name: 'R² Score', mlp: mlp.r2_score.toFixed(4), lstm: lstm.r2_score.toFixed(4), delta: (lstm.r2_score - mlp.r2_score).toFixed(4), positive: lstm.r2_score >= mlp.r2_score }
  ];

  const currentCm = activeMatrixTab === 'lstm' ? lstm.confusion_matrix : mlp.confusion_matrix;
  // [[TN, FP], [FN, TP]]
  const tn = currentCm[0][0];
  const fp = currentCm[0][1];
  const fn = currentCm[1][0];
  const tp = currentCm[1][1];
  const total = tn + fp + fn + tp;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {/* Header Banner */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
          <div>
            <span className="text-[10px] font-mono text-clinical-orange uppercase tracking-widest block font-bold">
              BENCHMARK LAB
            </span>
            <h2 className="font-display font-bold text-base sm:text-lg text-white">
              MLP PERCEPTRON VS. RECURRENT LSTM
            </h2>
            <p className="text-[11px] sm:text-xs font-mono text-gray-400 mt-0.5">
              Holdout evaluation on 5,220 hourly instances (2023–2024 test period, 20% chronological split).
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[10px] sm:text-xs font-mono flex-wrap gap-y-1">
            <span className="px-2.5 py-1 rounded bg-obsidian-surface border border-obsidian-border text-gray-300">
              POPULATION: <span className="text-white font-bold">5,220 HOURS</span>
            </span>
            <span className="px-2.5 py-1 rounded bg-obsidian-surface border border-obsidian-border text-gray-300">
              WINDOW: <span className="text-white font-bold">10-HOUR DAY</span>
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Table & ROC Curves Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Metrics Comparison Table (7 cols) */}
        <div className="lg:col-span-7 bg-obsidian-panel border border-obsidian-border rounded-sm p-3 sm:p-4 overflow-x-auto">
          <div className="flex items-center justify-between pb-2 mb-2 sm:pb-3 sm:mb-3 border-b border-obsidian-border/60 text-xs font-mono">
            <span className="font-semibold text-white text-[11px] sm:text-xs">CHRONOLOGICAL TEST METRICS</span>
            <span className="text-gray-500 text-[10px]">8 TELEMETRY SCORES</span>
          </div>

          <div className="min-w-[440px]">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-obsidian-border text-gray-400 text-[10px] uppercase">
                  <th className="py-2 px-2.5">Metric</th>
                  <th className="py-2 px-2.5 text-right">MLP</th>
                  <th className="py-2 px-2.5 text-right">LSTM</th>
                  <th className="py-2 px-2.5 text-right">Delta (LSTM - MLP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-border/40">
                {comparisonRows.map((row) => (
                  <tr key={row.name} className="hover:bg-obsidian-hover transition-colors">
                    <td className="py-2 px-2.5 text-gray-300 text-[11px]">{row.name}</td>
                    <td className="py-2 px-2.5 text-right text-gray-300 text-[11px]">{row.mlp}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-white text-[11px]">{row.lstm}</td>
                    <td className="py-2 px-2.5 text-right">
                      <span className={`inline-flex items-center space-x-0.5 font-bold text-[11px] ${
                        row.positive ? 'text-clinical-emerald' : 'text-clinical-orange'
                      }`}>
                        <span>{row.delta.startsWith('-') || row.delta.startsWith('+') ? row.delta : `+${row.delta}`}</span>
                        {row.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Comparative ROC Curves (5 cols) */}
        <div className="lg:col-span-5 bg-obsidian-panel border border-obsidian-border rounded-sm p-3 sm:p-4">
          <div className="flex items-center justify-between pb-2 mb-2 sm:pb-3 sm:mb-3 border-b border-obsidian-border/60 text-xs font-mono">
            <span className="font-semibold text-white text-[11px] sm:text-xs">ROC CURVE COMPARISON</span>
            <div className="flex items-center space-x-2 text-[10px]">
              <span className="text-[#FF4F00]">MLP ({mlp.roc_auc})</span>
              <span className="text-[#0284C7]">LSTM ({lstm.roc_auc})</span>
            </div>
          </div>

          <div className="w-full" style={{ height: isMobile ? 220 : 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252A36" />
                <XAxis dataKey="fpr" stroke="#64748B" tick={{ fontSize: 9, fontFamily: 'monospace' }} domain={[0, 1]} />
                <YAxis stroke="#64748B" tick={{ fontSize: 9, fontFamily: 'monospace' }} domain={[0, 1]} />
                <Tooltip
                  formatter={(value, name) => [Number(value).toFixed(3), name === 'mlp_tpr' ? 'MLP Sensitivity' : 'LSTM Sensitivity']}
                  labelFormatter={(lbl) => `FPR: ${Number(lbl).toFixed(3)}`}
                  contentStyle={{ backgroundColor: '#161922', border: '1px solid #282D37', fontSize: '10px', fontFamily: 'monospace' }}
                />
                <ReferenceLine stroke="#475569" strokeDasharray="3 3" segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} />
                <Line type="monotone" dataKey="mlp_tpr" stroke="#FF4F00" strokeWidth={1.8} dot={false} name="MLP Perceptron" />
                <Line type="monotone" dataKey="lstm_tpr" stroke="#0284C7" strokeWidth={2} dot={false} name="LSTM Recurrent" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[9px] font-mono text-gray-500 mt-1 text-center">
            True Positive Rate vs False Positive Rate
          </div>
        </div>
      </div>

      {/* Dual Confusion Matrix Deck */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-obsidian-border/60 text-xs font-mono gap-2">
          <div className="flex items-center space-x-1.5 text-white font-semibold">
            <Compass className="w-3.5 h-3.5 text-clinical-amber" />
            <span>CONFUSION MATRIX &amp; PURITY</span>
          </div>
          {/* Switch Matrix */}
          <div className="flex items-center space-x-1 bg-obsidian-surface p-1 rounded-sm border border-obsidian-border text-xs font-mono self-start sm:self-auto">
            <button
              onClick={() => setActiveMatrixTab('lstm')}
              className={`px-2.5 py-1 rounded-xs text-[10px] sm:text-xs transition-colors ${
                activeMatrixTab === 'lstm' ? 'bg-clinical-blue text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              LSTM MATRIX
            </button>
            <button
              onClick={() => setActiveMatrixTab('mlp')}
              className={`px-2.5 py-1 rounded-xs text-[10px] sm:text-xs transition-colors ${
                activeMatrixTab === 'mlp' ? 'bg-clinical-orange text-black font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              MLP MATRIX
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
          {/* 2x2 Matrix Grid */}
          <div className="bg-obsidian-surface border border-obsidian-border p-3 sm:p-4 rounded-sm font-mono text-xs">
            <div className="text-center font-bold text-gray-400 text-[10px] mb-2">
              PREDICTED OVERLOAD CLASS
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* True Negative */}
              <div className="p-3 bg-obsidian-panel border border-obsidian-border rounded-sm">
                <span className="text-[9px] text-gray-500 block uppercase">TRUE NEGATIVE (TN)</span>
                <span className="text-xl sm:text-2xl font-bold text-white block mt-0.5">{tn.toLocaleString()}</span>
                <span className="text-[9px] text-clinical-emerald block mt-0.5">
                  Nominal cleared ({((tn / total) * 100).toFixed(1)}%)
                </span>
              </div>

              {/* False Positive */}
              <div className="p-3 bg-obsidian-panel border border-clinical-amber/40 rounded-sm">
                <span className="text-[9px] text-clinical-amber block uppercase">FALSE POSITIVE (FP)</span>
                <span className="text-xl sm:text-2xl font-bold text-clinical-amber block mt-0.5">{fp.toLocaleString()}</span>
                <span className="text-[9px] text-gray-400 block mt-0.5">
                  False alarm ({((fp / total) * 100).toFixed(1)}%)
                </span>
              </div>

              {/* False Negative */}
              <div className="p-3 bg-obsidian-panel border border-clinical-orange/40 rounded-sm">
                <span className="text-[9px] text-clinical-orange block uppercase">FALSE NEGATIVE (FN)</span>
                <span className="text-xl sm:text-2xl font-bold text-clinical-orange block mt-0.5">{fn.toLocaleString()}</span>
                <span className="text-[9px] text-gray-400 block mt-0.5">
                  Missed risk ({((fn / total) * 100).toFixed(1)}%)
                </span>
              </div>

              {/* True Positive */}
              <div className="p-3 bg-obsidian-panel border border-clinical-emerald/40 rounded-sm">
                <span className="text-[9px] text-clinical-emerald block uppercase">TRUE POSITIVE (TP)</span>
                <span className="text-xl sm:text-2xl font-bold text-clinical-emerald block mt-0.5">{tp.toLocaleString()}</span>
                <span className="text-[9px] text-gray-300 block mt-0.5">
                  Overload caught ({((tp / total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Performance Breakdown */}
          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-2.5 sm:p-3 bg-obsidian-surface border border-obsidian-border rounded-sm">
              <div className="flex justify-between text-gray-400 text-[11px]">
                <span>SPECIFICITY:</span>
                <span className="font-bold text-white">{((tn / (tn + fp)) * 100).toFixed(1)}%</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Prevents unneeded physician call-ins during nominal clinic flow.
              </p>
            </div>

            <div className="p-2.5 sm:p-3 bg-obsidian-surface border border-obsidian-border rounded-sm">
              <div className="flex justify-between text-gray-400 text-[11px]">
                <span>RECALL / SENSITIVITY:</span>
                <span className="font-bold text-white">{((tp / (tp + fn)) * 100).toFixed(1)}%</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Proportion of real OPD crises caught before wait exceeds 45 mins.
              </p>
            </div>

            <div className="p-2.5 sm:p-3 bg-obsidian-surface border border-obsidian-border rounded-sm">
              <div className="flex justify-between text-gray-400 text-[11px]">
                <span>PRECISION (PPV):</span>
                <span className="font-bold text-white">{((tp / (tp + fp)) * 100).toFixed(1)}%</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Probability an automated alert represents a genuine clinical overload.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Architectural Breakdown */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-3 sm:p-4">
        <div className="border-b border-obsidian-border/60 pb-2 mb-3">
          <span className="text-[10px] font-mono text-clinical-blue uppercase tracking-widest block font-bold">
            THEORETICAL MECHANICS
          </span>
          <h3 className="font-display font-bold text-sm sm:text-base text-white">
            WHY LSTM HANDLES CUMULATIVE INTRADAY DELAYS DIFFERENTLY
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs font-mono">
          <div className="p-3 sm:p-4 bg-obsidian-surface border border-obsidian-border rounded-sm space-y-2">
            <div className="flex items-center space-x-1.5 text-clinical-orange font-bold text-xs sm:text-sm">
              <Cpu className="w-3.5 h-3.5" />
              <span>FEEDFORWARD MLP (STATELESS)</span>
            </div>
            <p className="text-gray-300 text-[11px] leading-relaxed">
              Static affine transforms without continuous recurrent state:
              <br />
              <code className="text-clinical-orange bg-black/40 px-1 py-0.2 rounded mt-1 inline-block">
                h₁ = ReLU(W₁xₜ + b₁)
              </code>
            </p>
            <p className="text-gray-400 text-[10px] leading-relaxed">
              Cannot dynamically accumulate early-morning delay trajectories into afternoon hours.
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-obsidian-surface border border-clinical-blue/40 rounded-sm space-y-2">
            <div className="flex items-center space-x-1.5 text-clinical-blue font-bold text-xs sm:text-sm">
              <Layers className="w-3.5 h-3.5" />
              <span>RECURRENT LSTM (BACKLOG ACCUMULATOR)</span>
            </div>
            <p className="text-gray-300 text-[11px] leading-relaxed">
              Cell memory updated through continuous sequence gates:
              <br />
              <code className="text-clinical-blue bg-black/40 px-1 py-0.2 rounded mt-1 inline-block">
                cₜ = fₜ ⊙ cₜ₋₁ + iₜ ⊙ c̃ₜ
              </code>
            </p>
            <p className="text-gray-400 text-[10px] leading-relaxed">
              Forget gate modulates whether morning bottlenecks carry over into afternoon shifts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
