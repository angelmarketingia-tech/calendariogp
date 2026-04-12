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
        sidebar: '#07090F',
        'sidebar-hover': '#111827',
        'sidebar-active': '#1E293B',
        brand: '#0EA5E9',
        'brand-light': '#38BDF8',
        'brand-dark': '#0284C7',
        'brand-muted': 'rgba(14,165,233,0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'brand': '0 4px 14px 0 rgba(14,165,233,0.25)',
        'card': '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px -2px rgba(0,0,0,0.08), 0 2px 8px -2px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
