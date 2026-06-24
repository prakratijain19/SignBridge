import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15182b',
        canvas: '#f6f5f1',
        signal: '#2f6df6',
        beacon: '#ff5a3c',
        surface: '#ffffff',
        signalInk: '#1f4fd0', // blue text/links on white (AA 4.5:1)
        bridge: '#0f9d8a', // calm teal for connected / success / online
        iris: '#6d5efc', // vibrant violet accent for gradients
        line: '#e4e2db', // hairline borders
        muted: '#5b5e72', // secondary text (AA on canvas/white)
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'var(--font-noto-deva)',
          'var(--font-noto-gujr)',
          'system-ui',
          'sans-serif',
        ],
        display: [
          'var(--font-display)',
          'var(--font-noto-deva)',
          'var(--font-noto-gujr)',
          'system-ui',
          'sans-serif',
        ],
      },
      backgroundImage: {
        // Signature aurora used for accents, gradient text, and primary buttons.
        aurora: 'linear-gradient(135deg, #2f6df6 0%, #6d5efc 48%, #0f9d8a 100%)',
        'aurora-soft':
          'linear-gradient(135deg, rgba(47,109,246,0.12) 0%, rgba(109,94,252,0.10) 50%, rgba(15,157,138,0.12) 100%)',
        // Dark hero with a colourful mesh glow.
        'hero-mesh':
          'radial-gradient(60% 90% at 15% 10%, rgba(47,109,246,0.45) 0%, transparent 60%), radial-gradient(55% 80% at 90% 20%, rgba(109,94,252,0.40) 0%, transparent 55%), radial-gradient(70% 90% at 70% 100%, rgba(15,157,138,0.40) 0%, transparent 60%)',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(21,24,43,0.04), 0 6px 20px -8px rgba(21,24,43,0.10)',
        lift: '0 14px 40px -12px rgba(21,24,43,0.22)',
        glow: '0 10px 34px -8px rgba(47,109,246,0.45)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        float: 'float 7s ease-in-out infinite',
        gradient: 'gradient-pan 9s ease infinite',
      },
    },
  },
  plugins: [],
};

export default config;
