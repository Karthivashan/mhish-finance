/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'] },
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        raised: v('raised'),
        line: v('line'),
        ink: v('ink'),
        muted: v('muted'),
        accent: v('accent'),
        'accent-ink': v('accent-ink'),
        income: v('income'),
        expense: v('expense'),
        warn: v('warn'),
        forest: '#0B3D2E',
        leaf: '#00A651',
        cream: '#F7F4ED',
      },
      borderRadius: { xl: '14px', '2xl': '18px' },
      boxShadow: {
        card: '0 1px 0 rgb(var(--shadow) / 0.02), 0 4px 14px -10px rgb(var(--shadow) / 0.18)',
        pop: '0 24px 48px -16px rgb(var(--shadow) / 0.55)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
        'slide-in': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'none' } },
        'pop-in': { '0%': { opacity: 0, transform: 'scale(.97) translateY(-4px)' }, '100%': { opacity: 1, transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-up': 'fade-up .35s ease-out both',
        'slide-in': 'slide-in .25s ease-out both',
        'pop-in': 'pop-in .15s ease-out both',
      },
    },
  },
  plugins: [],
};
