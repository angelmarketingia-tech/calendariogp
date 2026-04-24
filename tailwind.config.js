/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#0A1A0D',
        'sidebar-hover': '#152A18',
        'sidebar-active': '#1E3E22',
        brand: '#1A7B2E',
        'brand-light': '#2D9B42',
        'brand-dark': '#145F23',
        'brand-muted': 'rgba(26,123,46,0.12)',
        'brand-surface': '#F2F7F3',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'brand': '0 4px 14px 0 rgba(26,123,46,0.25)',
        'card': '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px -2px rgba(0,0,0,0.08), 0 2px 8px -2px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
