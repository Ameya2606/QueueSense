import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, GitCommit, Layers, Cpu, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

export default function ModelBenchmarkLab({ metrics, metadata }) {
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
    { name: 'Classification Accuracy', mlp: (mlp.accuracy * 100).toFixed(2) + '%', lstm: (lstm.accuracy * 100).toFixed(2) + '%', delta: ((lstm.accuracy - mlp.accuracy) * 100).toFixed(2) + '%', positive: lstm.accuracy >= mlp.accuracy, higherBetter: true },
    { name: 'Precision (Positive Class)', mlp: (mlp.precision * 100).toFixed(2) + '%', lstm: (lstm.precision * 100).toFixed(2) + '%', delta: ((lstm.precision - mlp.precision) * 100).toFixed(2) + '%', positive: lstm.precision >= mlp.precision, higherBetter: true },
    { name: 'Recall / Sensitivity', mlp: (mlp.recall * 100).toFixed(2) + '%', lstm: (lstm.recall * 100).toFixed(2) + '%', delta: ((lstm.recall - mlp.recall) * 100).toFixed(2) + '%', positive: lstm.recall >= mlp.recall, higherBetter: true },
    { name: 'F1 Score (Balanced Metric)', mlp: mlp.f1_score.toFixed(4), lstm: lstm.f1_score.toFixed(4), delta: (lstm.f1_score - mlp.f1_score).toFixed(4), positive: lstm.f1_score >= mlp.f1_score, higherBetter: true },
    { name: 'ROC-AUC (Area Under Curve)', mlp: mlp.roc_auc.toFixed(4), lstm: lstm.roc_auc.toFixed(4), delta: (lstm.roc_auc - mlp.roc_auc).toFixed(4), positive: lstm.roc_auc >= mlp.roc_auc, higherBetter: true },
    { name: 'Regression MAE (Mean Abs Error)', mlp: mlp.mae.toFixed(2) + 'm', lstm: lstm.mae.toFixed(2) + 'm', delta: (lstm.mae - mlp.mae).toFixed(2) + 'm', positive: lstm.mae <= mlp.mae, higherBetter: false },
    { name: 'Regression RMSE (Root Mean Sq)', mlp: mlp.rmse.toFixed(2) + 'm', lstm: lstm.rmse.toFixed(2) + 'm', delta: (lstm.rmse - mlp.rmse).toFixed(2) + 'm', positive: lstm.rmse <= mlp.rmse, higherBetter: false },
    { name: 'Regression R² Score', mlp: mlp.r2_score.toFixed(4), lstm: lstm.r2_score.toFixed(4), delta: (lstm.r2_score - mlp.r2_score).toFixed(4), positive: lstm.r2_score >= mlp.r2_score, higherBetter: true }
  ];

  const currentCm = activeMatrixTab === 'lstm' ? lstm.confusion_matrix : mlp.confusion_matrix;
  // [[TN, FP], [FN, TP]]
  const tn = currentCm[0][0];
  const fp = currentCm[0][1];
  const fn = currentCm[1][0];
  const tp = currentCm[1][1];
  const total = tn + fp + fn + tp;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono text-clinical-orange uppercase tracking-widest block font-bold">
              BENCHMARK &amp; ARCHITECTURAL LAB
            </span>
            <h2 className="font-display font-bold text-lg text-white">
              MLP PERCEPTRON VS. RECURRENT LSTM NETWORK
            </h2>
            <p className="text-xs font-mono text-gray-400 mt-0.5">
              Strict evaluation on the 5,220 hourly holdout instances (2023–2024 test period, 20% chronologically un-shuffled split).
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-3 py-1.5 rounded bg-obsidian-surface border border-obsidian-border text-gray-300">
              TEST POPULATION: <span className="text-white font-bold">5,220 HOURS</span>
            </span>
            <span className="px-3 py-1.5 rounded bg-obsidian-surface border border-obsidian-border text-gray-300">
              WINDOW: <span className="text-white font-bold">10-HOUR CLINIC DAY</span>
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Table & ROC Curves Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Metrics Comparison Table (7 cols) */}
        <div className="lg:col-span-7 bg-obsidian-panel border border-obsidian-border rounded-sm p-4 overflow-x-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-obsidian-border/60 text-xs font-mono">
            <span className="font-semibold text-white">CHRONOLOGICAL TEST SET METRICS</span>
            <span className="text-gray-500 text-[11px]">8 KEY STATISTICAL TELEMETRY INDICATORS</span>
          </div>

          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-obsidian-border text-gray-400 text-[10px] uppercase">
                <th className="py-2.5 px-3">Performance Metric</th>
                <th className="py-2.5 px-3 text-right">MLP Perceptron</th>
                <th className="py-2.5 px-3 text-right">LSTM Recurrent</th>
                <th className="py-2.5 px-3 text-right">Delta (LSTM - MLP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-border/40">
              {comparisonRows.map((row) => (
                <tr key={row.name} className="hover:bg-obsidian-hover transition-colors">
                  <td className="py-2.5 px-3 text-gray-300">{row.name}</td>
                  <td className="py-2.5 px-3 text-right text-gray-200">{row.mlp}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-white">{row.lstm}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`inline-flex items-center space-x-1 font-bold ${
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

        {/* Right: Comparative ROC Curves (5 cols) */}
        <div className="lg:col-span-5 bg-obsidian-panel border border-obsidian-border rounded-sm p-4">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-obsidian-border/60 text-xs font-mono">
            <span className="font-semibold text-white">ROC CURVE COMPARISON</span>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-[#FF4F00]">MLP (AUC {mlp.roc_auc})</span>
              <span className="text-[#0284C7]">LSTM (AUC {lstm.roc_auc})</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252A36" />
                <XAxis dataKey="fpr" stroke="#64748B" tick={{ fontSize: 10, fontFamily: 'monospace' }} domain={[0, 1]} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10, fontFamily: 'monospace' }} domain={[0, 1]} />
                <Tooltip
                  formatter={(value, name) => [Number(value).toFixed(3), name === 'mlp_tpr' ? 'MLP Sensitivity' : 'LSTM Sensitivity']}
                  labelFormatter={(lbl) => `FPR: ${Number(lbl).toFixed(3)}`}
                  contentStyle={{ backgroundColor: '#161922', border: '1px solid #282D37', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <ReferenceLine stroke="#475569" strokeDasharray="3 3" segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} />
                <Line type="monotone" dataKey="mlp_tpr" stroke="#FF4F00" strokeWidth={2} dot={false} name="MLP Perceptron" />
                <Line type="monotone" dataKey="lstm_tpr" stroke="#0284C7" strokeWidth={2.2} dot={false} name="LSTM Recurrent" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] font-mono text-gray-500 mt-2 text-center">
            Receiver Operating Characteristic // True Positive Rate vs False Positive Rate
          </div>
        </div>
      </div>

      {/* Dual Confusion Matrix Deck */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-obsidian-border/60 text-xs font-mono gap-2">
          <div className="flex items-center space-x-2 text-white font-semibold">
            <Compass className="w-4 h-4 text-clinical-amber" />
            <span>CONFUSION MATRIX &amp; CLASSIFICATION PURITY</span>
          </div>
          {/* Switch Matrix */}
          <div className="flex items-center space-x-1 bg-obsidian-surface p-1 rounded-sm border border-obsidian-border text-xs font-mono">
            <button
              onClick={() => setActiveMatrixTab('lstm')}
              className={`px-3 py-1 rounded-xs transition-colors ${
                activeMatrixTab === 'lstm' ? 'bg-clinical-blue text-white font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              LSTM CONFUSION MATRIX
            </button>
            <button
              onClick={() => setActiveMatrixTab('mlp')}
              className={`px-3 py-1 rounded-xs transition-colors ${
                activeMatrixTab === 'mlp' ? 'bg-clinical-orange text-black font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              MLP CONFUSION MATRIX
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* 2x2 Matrix Grid */}
          <div className="bg-obsidian-surface border border-obsidian-border p-4 rounded-sm font-mono text-xs">
            <div className="text-center font-bold text-gray-400 text-[11px] mb-3">
              PREDICTED CLASS (OVERLOAD FLAG)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* True Negative */}
              <div className="p-4 bg-obsidian-panel border border-obsidian-border rounded-sm">
                <span className="text-[10px] text-gray-500 block uppercase">TRUE NEGATIVE (TN)</span>
                <span className="text-2xl font-bold text-white block mt-1">{tn.toLocaleString()}</span>
                <span className="text-[10px] text-clinical-emerald block mt-0.5">
                  Nominal correctly cleared ({((tn / total) * 100).toFixed(1)}%)
                </span>
              </div>

              {/* False Positive */}
              <div className="p-4 bg-obsidian-panel border border-clinical-amber/40 rounded-sm">
                <span className="text-[10px] text-clinical-amber block uppercase">FALSE POSITIVE (FP)</span>
                <span className="text-2xl font-bold text-clinical-amber block mt-1">{fp.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  False alarm / Over-staffed ({((fp / total) * 100).toFixed(1)}%)
                </span>
              </div>

              {/* False Negative */}
              <div className="p-4 bg-obsidian-panel border border-clinical-orange/40 rounded-sm">
                <span className="text-[10px] text-clinical-orange block uppercase">FALSE NEGATIVE (FN)</span>
                <span className="text-2xl font-bold text-clinical-orange block mt-1">{fn.toLocaleString()}</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Missed overload risk ({((fn / total) * 100).toFixed(1)}%)
                </span>
              </div>

              {/* True Positive */}
              <div className="p-4 bg-obsidian-panel border border-clinical-emerald/40 rounded-sm">
                <span className="text-[10px] text-clinical-emerald block uppercase">TRUE POSITIVE (TP)</span>
                <span className="text-2xl font-bold text-clinical-emerald block mt-1">{tp.toLocaleString()}</span>
                <span className="text-[10px] text-gray-300 block mt-0.5">
                  Overload correctly caught ({((tp / total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Diagnostic Performance Breakdown */}
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-obsidian-surface border border-obsidian-border rounded-sm">
              <div className="flex justify-between text-gray-400">
                <span>SPECIFICITY (True Negative Rate):</span>
                <span className="font-bold text-white">{((tn / (tn + fp)) * 100).toFixed(1)}%</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Ability of the system to prevent unnecessary physician call-ins during nominal clinic flow.
              </p>
            </div>

            <div className="p-3 bg-obsidian-surface border border-obsidian-border rounded-sm">
              <div className="flex justify-between text-gray-400">
                <span>SENSITIVITY / RECALL (True Positive Rate):</span>
                <span className="font-bold text-white">{((tp / (tp + fn)) * 100).toFixed(1)}%</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Proportion of real hospital queue crises proactively flagged before patient wait exceeds 45 mins.
              </p>
            </div>

            <div className="p-3 bg-obsidian-surface border border-obsidian-border rounded-sm">
              <div className="flex justify-between text-gray-400">
                <span>POSITIVE PREDICTIVE VALUE (Precision):</span>
                <span className="font-bold text-white">{((tp / (tp + fp)) * 100).toFixed(1)}%</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Probability that an automated alert to open Overflow Room 4 represents a genuine clinical overload.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Architectural Breakdown: Feedforward vs Recurrent Memory */}
      <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4">
        <div className="border-b border-obsidian-border/60 pb-3 mb-4">
          <span className="text-[10px] font-mono text-clinical-blue uppercase tracking-widest block font-bold">
            THEORETICAL MECHANICS &amp; QUEUE THEORY INSIGHT
          </span>
          <h3 className="font-display font-bold text-base text-white">
            WHY LSTM HANDLES CUMULATIVE INTRADAY QUEUE DELAYS DIFFERENTLY THAN FEEDFORWARD MLP
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
          <div className="p-4 bg-obsidian-surface border border-obsidian-border rounded-sm space-y-3">
            <div className="flex items-center space-x-2 text-clinical-orange font-bold text-sm">
              <Cpu className="w-4 h-4" />
              <span>FEEDFORWARD MLP (STATELESS AT INFERENCE)</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              The MLP maps an hourly feature vector <span className="text-white font-bold">xₜ</span> directly to prediction through static affine transforms:
              <br />
              <code className="text-clinical-orange bg-black/40 px-1 py-0.5 rounded mt-1 inline-block">
                h₁ = ReLU(W₁xₜ + b₁), h₂ = ReLU(W₂h₁ + b₂)
              </code>
            </p>
            <p className="text-gray-400 leading-relaxed">
              <strong>Limitation:</strong> The MLP has no internal memory state. When an afternoon surge occurs (e.g., at 15:00), the model only sees the explicit lag numbers in that row. It cannot dynamically weight the trajectory of delays that compounded continuously since 08:00 AM.
            </p>
          </div>

          <div className="p-4 bg-obsidian-surface border border-clinical-blue/40 rounded-sm space-y-3">
            <div className="flex items-center space-x-2 text-clinical-blue font-bold text-sm">
              <Layers className="w-4 h-4" />
              <span>RECURRENT LSTM (CONTINUOUS BACKLOG ACCUMULATOR)</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              The LSTM updates its cell memory <span className="text-white font-bold">cₜ</span> and hidden state <span className="text-white font-bold">hₜ</span> across the sequence of operating hours via exact gating equations:
              <br />
              <code className="text-clinical-blue bg-black/40 px-1 py-0.5 rounded mt-1 inline-block">
                cₜ = fₜ ⊙ cₜ₋₁ + iₜ ⊙ c̃ₜ &nbsp;|&nbsp; hₜ = oₜ ⊙ tanh(cₜ)
              </code>
            </p>
            <p className="text-gray-400 leading-relaxed">
              <strong>Advantage:</strong> The forget gate <span className="text-white font-mono">fₜ</span> modulates whether morning bottlenecks have dissipated or are cascading into lunch shifts. The pure NumPy forward pass computes this exact recurrent propagation in &lt;1ms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
