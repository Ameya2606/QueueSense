import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Calendar, BarChart2, Database } from 'lucide-react';
import Header from './components/Header';
import TriageSimulator from './components/TriageSimulator';
import HistoricalReplay from './components/HistoricalReplay';
import ModelBenchmarkLab from './components/ModelBenchmarkLab';
import DatasetInspector from './components/DatasetInspector';
import { useMobileDetect } from './hooks/useMobileDetect';

export default function App() {
  const [activeTab, setActiveTab] = useState('simulator');
  const [telemetry, setTelemetry] = useState(null);
  const [presets, setPresets] = useState([]);
  const [replayDays, setReplayDays] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Explicit Mobile & Touch Detection Hook
  const deviceInfo = useMobileDetect();
  const { isMobile } = deviceInfo;

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

  // Bottom Navigation tabs definition
  const bottomNavTabs = [
    { id: 'simulator', shortLabel: 'Triage', icon: Activity },
    { id: 'replay', shortLabel: 'Replay', icon: Calendar },
    { id: 'benchmark', shortLabel: 'Benchmark', icon: BarChart2 },
    { id: 'dataset', shortLabel: 'Pipeline', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-obsidian-base text-gray-200 flex flex-col font-sans overflow-x-hidden max-w-[100vw] relative">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealth={systemHealth}
        deviceInfo={deviceInfo}
      />

      {/* Main Command Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'simulator' && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <TriageSimulator
                presets={presets}
                isMobile={isMobile}
              />
            </motion.div>
          )}

          {activeTab === 'replay' && (
            <motion.div
              key="replay"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <HistoricalReplay
                replayDays={replayDays}
                isMobile={isMobile}
              />
            </motion.div>
          )}

          {activeTab === 'benchmark' && (
            <motion.div
              key="benchmark"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <ModelBenchmarkLab
                metrics={telemetry?.metrics}
                metadata={telemetry?.metadata}
                isMobile={isMobile}
              />
            </motion.div>
          )}

          {activeTab === 'dataset' && (
            <motion.div
              key="dataset"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <DatasetInspector
                telemetry={telemetry}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Thumb-Zone Bottom Command Dock (Fixed at bottom on phones < 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0F1115]/95 backdrop-blur-md border-t border-[#D8D6CE]/20 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.6)]">
        <div className="grid grid-cols-4 gap-1 px-2 pt-1.5">
          {bottomNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-sm transition-all duration-150 relative ${
                  isActive
                    ? 'text-clinical-orange bg-clinical-orange/10 font-bold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-clinical-orange' : 'text-gray-400'}`} />
                <span className="text-[10px] font-mono tracking-wider mt-0.5 truncate max-w-full">
                  {tab.shortLabel}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-clinical-orange mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Command Deck Footer */}
      <footer className="border-t border-obsidian-border bg-obsidian-panel/80 py-3 sm:py-4 text-[10px] sm:text-xs font-mono text-gray-500 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-gray-400 font-semibold">QUEUESENSE</span>
            <span>//</span>
            <span>PS 1: OPD OVERLOAD (MLP + LSTM)</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 text-[9px] sm:text-[11px] text-gray-500">
            <span>CHRONOLOGICAL 80/20</span>
            <span>//</span>
            <span className="text-clinical-emerald">NUMPY LSTM (&lt;1ms)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
