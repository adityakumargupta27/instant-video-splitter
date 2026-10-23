import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      colors: {
        // Apple HIG-inspired semantic surface palette for dark mode
        surface: {
          base: '#000000',      // iOS dark base background
          primary: '#1C1C1E',   // iOS systemBackground (dark)
          secondary: '#2C2C2E', // iOS secondarySystemBackground (dark)
          tertiary: '#3A3A3C',  // iOS tertiarySystemBackground (dark)
          separator: '#38383A',
        },
        label: {
          primary: '#FFFFFF',
          secondary: 'rgba(235,235,245,0.6)',
          tertiary: 'rgba(235,235,245,0.3)',
          quaternary: 'rgba(235,235,245,0.18)',
        },
        accent: {
          blue: '#0A84FF',    // iOS systemBlue dark
          indigo: '#5E5CE6',  // iOS systemIndigo dark
          purple: '#BF5AF2',
          green: '#30D158',   // iOS systemGreen dark
          red: '#FF453A',     // iOS systemRed dark
          orange: '#FF9F0A',
        },
      },
      borderRadius: {
        'apple-sm': '8px',
        'apple-md': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
        'apple-2xl': '28px',
      },
      boxShadow: {
        'apple-sm': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        'apple-md': '0 4px 16px rgba(0,0,0,0.5)',
        'apple-lg': '0 8px 32px rgba(0,0,0,0.6)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'fade-up': 'fadeUp 0.3s ease-out both',
        'scale-in': 'scaleIn 0.2s ease-out both',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
