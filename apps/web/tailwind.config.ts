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
        // Phase 3 additions
        surface: '#ffffff',
        signalInk: '#1f4fd0', // blue text/links on white (AA 4.5:1)
        bridge: '#0f9d8a', // calm teal for connected / success / online
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
    },
  },
  plugins: [],
};

export default config;
