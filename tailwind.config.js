/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        mangrove: {
          50: '#f0f7f4',
          100: '#dbecdf',
          200: '#b7d9c1',
          300: '#8abf99',
          400: '#5a9d6e',
          500: '#3d7d52',
          600: '#2d6340',
          700: '#244f34',
          800: '#1d3f2a',
          900: '#162d1f',
          950: '#0a1810',
        },
        signal: {
          50: '#effaf6',
          100: '#d7f2e9',
          200: '#b0e4d4',
          300: '#7acdb8',
          400: '#42ad98',
          500: '#1f8f7d',
          600: '#147368',
          700: '#135c55',
          800: '#134a46',
          900: '#133d3a',
          950: '#06201e',
        },
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.03em',
        label: '0.14em',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'scroll-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '50%': { transform: 'translateY(0%)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'fade-in': 'fade-in 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'scale-in': 'scale-in 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'scroll-down': 'scroll-down 2s cubic-bezier(0.23, 1, 0.32, 1) infinite',
      },
    },
  },
  plugins: [],
};
