/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#FFFFFF',
          mute: '#F8F8FC',
        },
        ink: {
          DEFAULT: '#202137',
          soft: '#77798C',
        },
        accent: {
          DEFAULT: '#756BEE',
          soft: '#A99CFB',
          lavender: '#EFEDFF',
        },
        success: '#34A783',
        line: '#EAEAF1',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.6875rem',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(32 33 55 / 0.04), 0 4px 16px -4px rgb(32 33 55 / 0.08)',
        lift: '0 2px 4px 0 rgb(32 33 55 / 0.05), 0 12px 32px -8px rgb(32 33 55 / 0.14)',
        glow: '0 0 0 1px rgb(117 107 238 / 0.12), 0 8px 30px -6px rgb(117 107 238 / 0.25)',
      },
      borderRadius: {
        xl2: '1rem',
        xl3: '1.25rem',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
