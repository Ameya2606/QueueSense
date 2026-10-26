/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          light: '#F4F3EF',
          DEFAULT: '#ECEAE4',
          card: '#FFFFFF',
          border: '#D8D6CE',
        },
        obsidian: {
          base: '#0B0D10',
          panel: '#12151B',
          surface: '#1A1E26',
          border: '#282D37',
          hover: '#222731',
        },
        clinical: {
          orange: '#FF4F00',     // International Signal Orange - Critical OPD overload
          emerald: '#00875A',    // Medical Emerald - Nominal queue flow
          amber: '#D97706',      // Warning Amber - Approaching capacity
          blue: '#0284C7',       // Informational clinical telemetry
          steel: '#64748B',      // Secondary structural elements
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'swiss': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'tactile': 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0,0,0,0.15)',
      }
    },
  },
  plugins: [],
}
