import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import TriageSimulator from './components/TriageSimulator';
import HistoricalReplay from './components/HistoricalReplay';
import ModelBenchmarkLab from './components/ModelBenchmarkLab';
import DatasetInspector from './components/DatasetInspector';

export default function App() {
  const [activeTab, setActiveTab] = useState('simulator');
  const [telemetry, setTelemetry] = useState(null);
  const [presets, setPresets] = useState([]);
  const [replayDays, setReplayDays] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ingest data from backend API
  useEffect(() => {
    async function initTelemetry() {
      try {
        const [telRes, presetsRes, healthRes] = await Promise.all([
          fetch('/api/telemetry'),
          fetch('/api/presets'),
          fetch('/api/health')
        ]);

        if (telRes.ok) {
          const telData = await telRes.json();
          setTelemetry(telData);
          if (telData.historical_replay_days) {
            setReplayDays(telData.historical_replay_days);
          }
        }

        if (presetsRes.ok) {
          const presetsData = await presetsRes.json();
          setPresets(presetsData);
        }

        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setSystemHealth(healthData);
        }
      } catch (err) {
        console.error("Failed to load QueueSense telemetry:", err);
      } finally {
        setIsLoading(false);
      }
    }
    initTelemetry();
  }, []);

  return (
    <div className="min-h-screen bg-obsidian-base text-gray-200 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealth={systemHealth}
      />

      {/* Main Command Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'simulator' && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <TriageSimulator presets={presets} />
            </motion.div>
          )}

          {activeTab === 'replay' && (
            <motion.div
              key="replay"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <HistoricalReplay replayDays={replayDays} />
            </motion.div>
          )}

          {activeTab === 'benchmark' && (
            <motion.div
              key="benchmark"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <ModelBenchmarkLab
                metrics={telemetry?.metrics}
                metadata={telemetry?.metadata}
              />
            </motion.div>
          )}

          {activeTab === 'dataset' && (
            <motion.div
              key="dataset"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <DatasetInspector telemetry={telemetry} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Command Deck Footer */}
      <footer className="border-t border-obsidian-border bg-obsidian-panel/80 py-4 text-xs font-mono text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="text-gray-400 font-semibold">QUEUESENSE TELEMETRY ENGINE</span>
            <span>//</span>
            <span>PS 1: PREDICTING HOSPITAL OPD OVERLOAD (MLP + LSTM)</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>STRICT 80/20 NON-SHUFFLED CHRONOLOGICAL SPLIT</span>
            <span>//</span>
            <span className="text-clinical-emerald">PORTABLE NUMPY LSTM INFERENCE (&lt;1ms)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
