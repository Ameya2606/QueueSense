import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, Database, Calendar, BarChart2, ShieldCheck, Clock } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, systemHealth }) {
  const [currentTime, setCurrentTime] = useState('');

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
    { id: 'simulator', label: '01 // LIVE TRIAGE SIMULATOR', icon: Activity },
    { id: 'replay', label: '02 // 2024 REPLAY ENGINE', icon: Calendar },
    { id: 'benchmark', label: '03 // MLP VS LSTM LAB', icon: BarChart2 },
    { id: 'dataset', label: '04 // PIPELINE & DATASET', icon: Database },
  ];

  return (
    <header className="border-b border-obsidian-border bg-obsidian-base/95 backdrop-blur sticky top-0 z-50">
      {/* Top Telemetry Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono border-b border-obsidian-border/50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-clinical-emerald opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-clinical-emerald"></span>
            </span>
            <span className="text-gray-300 font-semibold tracking-wider">SYSTEM ONLINE</span>
          </div>
          <span className="text-obsidian-border">|</span>
          <span className="text-gray-400">NODES: <span className="text-gray-200">OPD-CENTRAL-01</span></span>
          <span className="text-obsidian-border">|</span>
          <span className="text-gray-400">MODELS: <span className="text-clinical-emerald">MLP (128-64-32) + NUMPY LSTM (32U)</span></span>
        </div>

        <div className="flex items-center space-x-4 mt-1 sm:mt-0">
          <div className="flex items-center space-x-1.5 text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-clinical-blue" />
            <span>MEM: &lt; 38MB</span>
          </div>
          <span className="text-obsidian-border">|</span>
          <div className="flex items-center space-x-1.5 text-gray-300">
            <Clock className="w-3.5 h-3.5 text-clinical-amber" />
            <span className="tabular-nums font-mono">{currentTime || '08:00:00 UTC'}</span>
          </div>
        </div>
      </div>

      {/* Main Branding & Workspace Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-3">
          <div>
            <div className="flex items-center space-x-3">
              <div className="h-7 w-7 bg-clinical-orange flex items-center justify-center rounded-sm font-mono font-bold text-black text-sm shadow-sm">
                QS
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white flex items-center space-x-2">
                <span>QUEUESENSE</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded border border-clinical-orange/40 text-clinical-orange bg-clinical-orange/10">
                  CLINICAL TELEMETRY v1.0
                </span>
              </h1>
            </div>
            <p className="text-xs font-mono text-gray-400 mt-1">
              Hospital OPD Overload Prediction System // Sequential Backlog Modeling &amp; Rapid Triage Decision Support
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-2 text-xs font-mono text-gray-400">
            <span className="px-2 py-1 rounded bg-obsidian-surface border border-obsidian-border">
              TARGET: <span className="text-white">WAIT &gt; 45m OR WORKLOAD &gt; 65m</span>
            </span>
          </div>
        </div>

        {/* Tabbed Deck */}
        <nav className="flex space-x-1 overflow-x-auto pb-px" aria-label="Workspaces">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 text-xs font-mono font-semibold tracking-wider transition-colors duration-150 flex items-center space-x-2 whitespace-nowrap ${
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
