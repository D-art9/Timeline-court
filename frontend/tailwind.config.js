/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Premium neutral palette inspired by Vercel/Linear
        bg: {
          dark: '#09090b',      // Pitch dark
          card: '#18181b',      // Zinc-900
          border: '#27272a',    // Zinc-800
        },
        brand: {
          offwhite: '#FAF9F6',
          lightgray: '#F4F4F5',
          slate: '#27272a',
          blue: {
            DEFAULT: '#3b82f6',
            muted: '#2563eb',
          },
          green: {
            DEFAULT: '#10b981',
            muted: '#059669',
          },
          purple: {
            DEFAULT: '#8b5cf6',
            muted: '#7c3aed',
          },
          orange: {
            DEFAULT: '#f97316',
            muted: '#ea580c',
          },
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.15)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.15)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.15)',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.15)',
      }
    },
  },
  plugins: [],
}
