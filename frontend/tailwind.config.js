/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          start: '#4F46E5',
          end: '#06B6D4',
        },
        accent: {
          yellow: '#F59E0B',
          green: '#10B981',
        },
        neutral: {
          900: '#0F172A',
          700: '#374151',
          300: '#D1D5DB',
          100: '#F3F4F6',
        },
        semantic: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
      boxShadow: {
        level1: '0px 1px 2px rgba(15, 23, 42, 0.04)',
        level2: '0px 4px 8px rgba(15, 23, 42, 0.06)',
        level3: '0px 12px 24px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
}