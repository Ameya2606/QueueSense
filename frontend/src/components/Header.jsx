import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Database, Calendar, BarChart2, ShieldCheck, Clock, Smartphone, Monitor } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, systemHealth, deviceInfo }) {
  const [currentTime, setCurrentTime] = useState('');
  const isMobile = deviceInfo?.isMobile;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'simulator', label: '01 // LIVE TRIAGE SIMULATOR', shortLabel: 'Triage', icon: Activity },
    { id: 'replay', label: '02 // 2024 REPLAY ENGINE', shortLabel: 'Replay', icon: Calendar },
    { id: 'benchmark', label: '03 // MLP VS LSTM LAB', shortLabel: 'Benchmark', icon: BarChart2 },
    { id: 'dataset', label: '04 // PIPELINE & DATASET', shortLabel: 'Pipeline', icon: Database },
  ];

  return (
    <header className="border-b border-obsidian-border bg-obsidian-base/95 backdrop-blur sticky top-0 z-40">
      {/* Top Telemetry Strip - Adaptive for mobile & desktop */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between text-[11px] sm:text-xs font-mono border-b border-obsidian-border/50 gap-y-1.5">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1">
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-clinical-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-clinical-emerald"></span>
            </span>
            <span className="text-gray-300 font-semibold tracking-wider">ONLINE</span>
          </div>

          <span className="text-obsidian-border hidden sm:inline">|</span>

          {/* Mode Telemetry Pill */}
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border flex items-center space-x-1 border-clinical-blue/40 bg-clinical-blue/10 text-clinical-blue">
            {isMobile ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
            <span>{isMobile ? 'MODE :: HANDHELD_TOUCH' : 'MODE :: DESKTOP_TERMINAL'}</span>
          </span>

          <span className="text-obsidian-border hidden md:inline">|</span>
          <span className="text-gray-400 hidden md:inline">MODELS: <span className="text-clinical-emerald">MLP (128-64-32) + NUMPY LSTM (32U)</span></span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 text-[11px]">
          <div className="flex items-center space-x-1 text-gray-400">
            <ShieldCheck className="w-3 h-3 text-clinical-blue" />
            <span>&lt;38MB</span>
          </div>
          <span className="text-obsidian-border">|</span>
          <div className="flex items-center space-x-1 text-gray-300">
            <Clock className="w-3 h-3 text-clinical-amber" />
            <span className="tabular-nums font-mono">{currentTime || '08:00:00 UTC'}</span>
          </div>
        </div>
      </div>

      {/* Main Branding & Workspace Tabs */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-2 sm:pb-3 gap-2">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="h-6 w-6 sm:h-7 sm:w-7 bg-clinical-orange flex items-center justify-center rounded-xs font-mono font-bold text-black text-xs sm:text-sm shadow-sm flex-shrink-0">
                QS
              </div>
              <h1 className="text-lg sm:text-2xl font-display font-bold tracking-tight text-white flex items-center space-x-2 truncate">
                <span>QUEUESENSE</span>
                <span className="text-[10px] sm:text-xs font-mono font-normal px-1.5 py-0.2 rounded border border-clinical-orange/40 text-clinical-orange bg-clinical-orange/10">
                  OPD TELEMETRY
                </span>
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs font-mono text-gray-400 mt-0.5 hidden sm:block">
              Hospital OPD Overload Prediction System // Sequential Backlog Modeling &amp; Rapid Triage Decision Support
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[10px] sm:text-xs font-mono text-gray-400">
            <span className="px-2 py-0.5 rounded bg-obsidian-surface border border-obsidian-border">
              TARGET: <span className="text-white font-semibold">WAIT &gt; 45m OR WORKLOAD &gt; 65m</span>
            </span>
          </div>
        </div>

        {/* Desktop Tabbed Deck (Hidden on mobile < 768px, replaced by bottom thumb dock) */}
        <nav className="hidden md:flex space-x-1 overflow-x-auto pb-px" aria-label="Workspaces">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2 text-xs font-mono font-semibold tracking-wider transition-colors duration-150 flex items-center space-x-2 whitespace-nowrap ${
                  isActive
                    ? 'text-white bg-obsidian-panel border-t border-x border-obsidian-border rounded-t-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-obsidian-panel/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-clinical-orange' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-clinical-orange"
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
