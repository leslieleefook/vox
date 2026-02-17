import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Vox Under-Glow colors
        'vox-idle': '#8B5CF6',      // Electric Violet
        'vox-active': '#06B6D4',     // Cyan Neon
        'vox-error': '#FB7185',      // Rose Glow
        // Surface levels
        'surface-01': 'rgba(255, 255, 255, 0.05)',
        'surface-02': 'rgba(255, 255, 255, 0.10)',
        'surface-03': 'rgba(255, 255, 255, 0.20)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(280,80%,60%,0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,85%,63%,0.2) 0px, transparent 50%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 15px rgba(139, 92, 246, 0.1)',
      },
      backdropBlur: {
        'glass': '16px',
        'glass-xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'readable': '0.02em',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(139, 92, 246, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.8)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
