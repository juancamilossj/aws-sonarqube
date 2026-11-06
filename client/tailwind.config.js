export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#070913",
          card: "#0d1127",
          border: "#1e293b",
          cyan: "#00f2fe",
          blue: "#4facfe",
          purple: "#8b5cf6",
          neonPurple: "#a855f7",
          neonGreen: "#10b981",
          neonAmber: "#f59e0b",
          neonRose: "#f43f5e"
        }
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 242, 254, 0.4), 0 0 10px rgba(0, 242, 254, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 242, 254, 0.8), 0 0 30px rgba(0, 242, 254, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
