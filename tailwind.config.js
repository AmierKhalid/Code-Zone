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
        void: '#09080F',
        'void-2': '#0E0C1A',
        'void-3': '#130F24',
        violet: {
          DEFAULT: '#7B2FBE',
          light: '#9B4FDE',
          dim: 'rgba(123, 47, 190, 0.35)',
        },
        lilac: {
          DEFAULT: '#C4B1D4',
          dim: 'rgba(196, 177, 212, 0.15)',
          border: 'rgba(196, 177, 212, 0.18)',
        },
        'hot-white': '#F0EAFF',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'violet-gradient': 'linear-gradient(135deg, #7B2FBE, #9B4FDE)',
        'void-gradient': 'linear-gradient(180deg, #09080F 0%, #0E0C1A 100%)',
      },
      animation: {
        'float-screen': 'float-screen 6s ease-in-out infinite',
        'blink-cursor': 'blink-cursor 1s step-end infinite',
        'marquee-scroll': 'marquee-scroll 40s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'orbit': 'orbit-spin 20s linear infinite',
        'bloom': 'bloom-ring 3s ease-out infinite',
      },
      boxShadow: {
        'violet-glow': '0 0 30px rgba(123, 47, 190, 0.35)',
        'violet-glow-lg': '0 0 60px rgba(123, 47, 190, 0.4), 0 0 120px rgba(123, 47, 190, 0.15)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(240, 234, 255, 0.05)',
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  plugins: [],
};