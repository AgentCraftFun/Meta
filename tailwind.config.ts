import type { Config } from 'tailwindcss';
import {
  colors as dsColors,
  motion as dsMotion,
  radius as dsRadius,
  space as dsSpace,
  type as dsType,
} from './lib/design/tokens';

const spacing = Object.fromEntries(
  Object.entries(dsSpace).map(([k, v]) => [`ds${k}`, `${v}px`])
);

const borderRadius = Object.fromEntries(
  Object.entries(dsRadius).map(([k, v]) => [`ds-${k}`, `${v}px`])
);

const transitionDuration = Object.fromEntries(
  Object.entries(dsMotion.duration).map(([k, v]) => [`ds-${k}`, `${v}ms`])
);

const transitionTimingFunction = Object.fromEntries(
  Object.entries(dsMotion.ease).map(([k, v]) => [`ds-${k}`, v])
);

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#5ef0ff',
          amber: '#ffb547',
          violet: '#b48bff',
          red: '#ff5d6c',
        },
        ds: dsColors,
        // Themeable brand accent. Backed by CSS vars (see app/globals.css):
        // defaults to the original cyan ramp everywhere, and /siteMARS overrides
        // the vars under `.theme-mars` to the Mars palette. `<alpha-value>` keeps
        // Tailwind opacity modifiers (e.g. text-accent-400/70) working.
        accent: {
          200: 'rgb(var(--accent-200) / <alpha-value>)',
          300: 'rgb(var(--accent-300) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
        },
      },
      spacing,
      borderRadius,
      transitionDuration,
      transitionTimingFunction,
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'Space Grotesk',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
        'ds-sans': [...dsType.sans],
        'ds-mono': [...dsType.mono],
      },
      boxShadow: {
        'neon-cyan': '0 0 24px rgba(94, 240, 255, 0.35)',
        'neon-amber': '0 0 24px rgba(255, 181, 71, 0.35)',
        'neon-violet': '0 0 24px rgba(180, 139, 255, 0.35)',
      },
      animation: {
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'fade-in': 'fadeIn 600ms ease-out forwards',
        'ds-pulse': 'dsPulse 1.5s ease-in-out infinite',
        'ds-flash-up': 'ds-flash-up 400ms ease-out forwards',
        'ds-flash-down': 'ds-flash-down 400ms ease-out forwards',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        dsPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
