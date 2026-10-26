import React from 'react';
import { motion } from 'framer-motion';

export default function FloorplanVisualizer({ isOverloaded, waitMins, queueUtilization, activeHour = 10, riskCategory = "Nominal Flow" }) {
  // Determine color theme based on overload severity
  const isCritical = isOverloaded || waitMins > 45.0 || queueUtilization > 1.0;
  const isApproaching = !isCritical && (waitMins > 32.0 || queueUtilization > 0.75);

  const themeColor = isCritical ? '#FF4F00' : isApproaching ? '#D97706' : '#00875A';
  const themeBg = isCritical ? 'rgba(255, 79, 0, 0.08)' : isApproaching ? 'rgba(217, 119, 6, 0.08)' : 'rgba(0, 135, 90, 0.08)';
  const flowSpeed = isCritical ? 6 : isApproaching ? 4 : 2.5; // seconds per animation loop

  // Backlog token counts
  const tokenCount = isCritical ? 14 : isApproaching ? 8 : 4;
  const tokens = Array.from({ length: tokenCount }, (_, i) => i);

  return (
    <div className="bg-obsidian-panel border border-obsidian-border rounded-sm p-4 relative overflow-hidden">
      {/* Header telemetry badge */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-2 border-b border-obsidian-border/60 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <span className="text-gray-400">TELEMETRY DECK:</span>
          <span className="font-semibold text-gray-200">LIVE OPD FLOORPLAN &amp; QUEUE TRANSIT</span>
          <span className="text-obsidian-border">|</span>
          <span className="text-gray-400">ACTIVE TIMESTEP: <span className="text-white">{String(activeHour).padStart(2, '0')}:00</span></span>
        </div>
        <div className="flex items-center space-x-2 mt-1 sm:mt-0">
          <span className="text-gray-400">STATE:</span>
          <span
            className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
            style={{ color: themeColor, backgroundColor: themeBg, border: `1px solid ${themeColor}40` }}
          >
            {isCritical ? 'CRITICAL BOTTLENECK' : isApproaching ? 'CAPACITY STRAIN' : 'NOMINAL TRANSIT'}
          </span>
        </div>
      </div>

      {/* Bespoke Architectural Floorplan SVG */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 860 210"
          className="w-full min-w-[700px] h-auto select-none font-mono"
          style={{ background: '#0D0F14' }}
        >
          {/* Subtle Grid Backdrop */}
          <defs>
            <pattern id="floorGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
            </pattern>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00875A" stopOpacity="0.8" />
              <stop offset="50%" stopColor={themeColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <rect width="860" height="210" fill="url(#floorGrid)" />

          {/* Flow Transit Line Guide */}
          <path
            d="M 120 105 L 250 105 L 370 105 L 530 65 M 370 105 L 530 115 M 370 105 L 530 165 M 370 105 L 720 105"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* ================================================================= */}
          {/* STATION 1: CHECK-IN DESK & RAPID TRIAGE (X: 20, W: 160) */}
          {/* ================================================================= */}
          <g>
            <rect
              x="20"
              y="25"
              width="160"
              height="160"
              rx="2"
              fill="#12151B"
              stroke="#282D37"
              strokeWidth="1.2"
            />
            {/* Corner Bracket */}
            <path d="M 20 35 L 20 25 L 30 25" fill="none" stroke="#64748B" strokeWidth="2" />
            <text x="32" y="44" fill="#94A3B8" fontSize="10" fontWeight="600" letterSpacing="1">
              01 // CHECK-IN DESK
            </text>
            <text x="32" y="58" fill="#475569" fontSize="9">
              Digital Kiosk &amp; Registration
            </text>

            {/* Receptionist Counter */}
            <rect x="35" y="75" width="130" height="35" rx="1" fill="#1A1E26" stroke="#333A48" strokeWidth="1" />
            <text x="45" y="96" fill="#CBD5E1" fontSize="10">Kiosk 1 &amp; 2 Active</text>

            <rect x="35" y="125" width="130" height="42" rx="1" fill="#161922" stroke="#252A36" strokeWidth="1" />
            <text x="45" y="142" fill="#64748B" fontSize="9">ARRIVAL OFFSET</text>
            <text x="45" y="157" fill="#E2E8F0" fontSize="11" fontWeight="bold">-6.8 min early avg</text>
          </g>

          {/* Transit Arrow 1 */}
          <path d="M 185 105 L 215 105" stroke={themeColor} strokeWidth="1.5" markerEnd="url(#arrow)" />

          {/* ================================================================= */}
          {/* STATION 2: CENTRAL WAITING BAY (X: 220, W: 270) */}
          {/* ================================================================= */}
          <g>
            <rect
              x="220"
              y="25"
              width="270"
              height="160"
              rx="2"
              fill={isCritical ? 'rgba(255, 79, 0, 0.04)' : '#12151B'}
              stroke={isCritical ? '#FF4F00' : isApproaching ? '#D97706' : '#282D37'}
              strokeWidth={isCritical ? '1.8' : '1.2'}
            />
            <path d="M 220 35 L 220 25 L 230 25" fill="none" stroke={themeColor} strokeWidth="2" />
            <text x="232" y="44" fill={isCritical ? '#FF4F00' : '#CBD5E1'} fontSize="10" fontWeight="600" letterSpacing="1">
              02 // MAIN WAITING BAY
            </text>
            <text x="232" y="58" fill="#64748B" fontSize="9">
              Transit Backlog &amp; Triage Staging
            </text>

            {/* Waiting Bay Seats Grid */}
            <g transform="translate(235, 70)">
              {/* Row 1 */}
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <rect
                  key={`r1-${idx}`}
                  x={idx * 38}
                  y="0"
                  width="28"
                  height="22"
                  rx="2"
                  fill={idx < tokenCount / 2 ? `${themeColor}25` : '#1A1E26'}
                  stroke={idx < tokenCount / 2 ? themeColor : '#2E3544'}
                  strokeWidth="1"
                />
              ))}
              {/* Row 2 */}
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <rect
                  key={`r2-${idx}`}
                  x={idx * 38}
                  y="30"
                  width="28"
                  height="22"
                  rx="2"
                  fill={idx + 6 < tokenCount ? `${themeColor}25` : '#1A1E26'}
                  stroke={idx + 6 < tokenCount ? themeColor : '#2E3544'}
                  strokeWidth="1"
                />
              ))}
            </g>

            {/* Waiting Bay Live Metric Strip */}
            <g transform="translate(235, 138)">
              <rect x="0" y="0" width="115" height="34" rx="1" fill="#161922" stroke="#252A36" strokeWidth="1" />
              <text x="10" y="14" fill="#64748B" fontSize="8.5">PROJECTED WAIT</text>
              <text x="10" y="28" fill={themeColor} fontSize="12" fontWeight="bold">
                {waitMins.toFixed(0)} min
              </text>

              <rect x="125" y="0" width="115" height="34" rx="1" fill="#161922" stroke="#252A36" strokeWidth="1" />
              <text x="135" y="14" fill="#64748B" fontSize="8.5">QUEUE UTIL (ρ)</text>
              <text x="135" y="28" fill={queueUtilization > 1 ? '#FF4F00' : '#E2E8F0'} fontSize="12" fontWeight="bold">
                {(queueUtilization).toFixed(2)}
              </text>
            </g>
          </g>

          {/* ================================================================= */}
          {/* STATION 3: CONSULTATION SUITES (X: 520, W: 180) */}
          {/* ================================================================= */}
          <g>
            <rect
              x="520"
              y="25"
              width="180"
              height="160"
              rx="2"
              fill="#12151B"
              stroke="#282D37"
              strokeWidth="1.2"
            />
            <path d="M 520 35 L 520 25 L 530 25" fill="none" stroke="#64748B" strokeWidth="2" />
            <text x="532" y="44" fill="#94A3B8" fontSize="10" fontWeight="600" letterSpacing="1">
              03 // CONSULT CLINICS
            </text>

            {/* Suite 1 */}
            <g transform="translate(532, 54)">
              <rect x="0" y="0" width="156" height="36" rx="1" fill="#181C25" stroke="#2C3342" strokeWidth="1" />
              <circle cx="12" cy="18" r="4" fill="#00875A" />
              <text x="24" y="17" fill="#CBD5E1" fontSize="10" fontWeight="600">Room 1: General OPD</text>
              <text x="24" y="28" fill="#64748B" fontSize="8.5">Dr. Vance (Attending)</text>
            </g>

            {/* Suite 2 */}
            <g transform="translate(532, 96)">
              <rect x="0" y="0" width="156" height="36" rx="1" fill="#181C25" stroke="#2C3342" strokeWidth="1" />
              <circle cx="12" cy="18" r="4" fill={isCritical ? '#FF4F00' : '#00875A'} />
              <text x="24" y="17" fill="#CBD5E1" fontSize="10" fontWeight="600">Room 2: Senior Clinic</text>
              <text x="24" y="28" fill="#64748B" fontSize="8.5">Dr. Ellis (Geriatric Lead)</text>
            </g>

            {/* Suite 3 */}
            <g transform="translate(532, 138)">
              <rect x="0" y="0" width="156" height="36" rx="1" fill="#181C25" stroke="#2C3342" strokeWidth="1" />
              <circle cx="12" cy="18" r="4" fill="#00875A" />
              <text x="24" y="17" fill="#CBD5E1" fontSize="10" fontWeight="600">Room 3: Follow-Up</text>
              <text x="24" y="28" fill="#64748B" fontSize="8.5">Dr. Chen (Internal Med)</text>
            </g>
          </g>

          {/* ================================================================= */}
          {/* STATION 4: OVERFLOW & RAPID ESCALATION SUITE 4 (X: 720, W: 120) */}
          {/* ================================================================= */}
          <g>
            <rect
              x="720"
              y="25"
              width="120"
              height="160"
              rx="2"
              fill={isCritical ? 'rgba(255, 79, 0, 0.12)' : '#101217'}
              stroke={isCritical ? '#FF4F00' : '#282D37'}
              strokeWidth={isCritical ? '2' : '1'}
              strokeDasharray={isCritical ? 'none' : '3 3'}
            />
            <text x="732" y="44" fill={isCritical ? '#FF4F00' : '#64748B'} fontSize="9.5" fontWeight="600">
              04 // OVERFLOW
            </text>
            <text x="732" y="58" fill="#475569" fontSize="8.5">
              Escalation Bay
            </text>

            <rect
              x="730"
              y="75"
              width="100"
              height="60"
              rx="1"
              fill={isCritical ? '#23120E' : '#141720'}
              stroke={isCritical ? '#FF4F00' : '#2A303E'}
              strokeWidth="1"
            />
            <text x="740" y="98" fill={isCritical ? '#FF4F00' : '#475569'} fontSize="10" fontWeight="bold">
              {isCritical ? '● ACTIVE' : '○ STANDBY'}
            </text>
            <text x="740" y="114" fill="#94A3B8" fontSize="8.5">
              {isCritical ? 'Room 4 Opened' : 'Capacity Idle'}
            </text>

            <rect x="730" y="145" width="100" height="28" rx="1" fill="#161922" stroke="#252A36" strokeWidth="1" />
            <text x="740" y="163" fill="#64748B" fontSize="8.5">
              {isCritical ? 'DISPATCH ON-CALL' : 'NO ESCALATION'}
            </text>
          </g>

          {/* ================================================================= */}
          {/* ANIMATED MOVING PATIENT TOKENS (Framer Motion in SVG) */}
          {/* ================================================================= */}
          {tokens.map((tokenIdx) => {
            const delay = (tokenIdx * flowSpeed) / tokenCount;
            return (
              <motion.circle
                key={`token-${tokenIdx}`}
                r="4.5"
                fill={themeColor}
                stroke="#FFFFFF"
                strokeWidth="1"
                initial={{ cx: 40, cy: 105, opacity: 0 }}
                animate={{
                  cx: [40, 200, 360, 520, 680],
                  cy: [105, 105, 105 + (tokenIdx % 2 === 0 ? 25 : -25), 105, 105],
                  opacity: [0, 1, 1, 1, 0],
                  scale: [0.8, 1, 1.2, 1, 0.8]
                }}
                transition={{
                  duration: flowSpeed,
                  repeat: Infinity,
                  delay: delay,
                  ease: "easeInOut"
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Micro-telemetry footer */}
      <div className="flex flex-wrap items-center justify-between mt-2 pt-2 border-t border-obsidian-border/40 text-[11px] font-mono text-gray-400">
        <div className="flex items-center space-x-4">
          <span>THROUGHPUT: <span className="text-gray-200">~17.5 min / consult</span></span>
          <span className="text-obsidian-border">|</span>
          <span>DISCHARGE VELOCITY: <span className="text-gray-200">{isCritical ? '0.28 pt/min (Delayed)' : '0.54 pt/min (Nominal)'}</span></span>
        </div>
        <div className="text-right text-gray-500">
          Flow synchronized to live model inference loop
        </div>
      </div>
    </div>
  );
}
