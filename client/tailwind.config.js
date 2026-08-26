/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dialer: {
          app: '#000000',
          card: '#FFFFFF',
          text: '#111827',
          textSecondary: '#6B7280',
          textMuted: '#9CA3AF',
          key: '#F3F4F6',
          keyHover: '#E5E7EB',
          border: '#E5E7EB',
          accent: '#22C55E',
          accentDark: '#16A34A',
          danger: '#EF4444',
        },
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
