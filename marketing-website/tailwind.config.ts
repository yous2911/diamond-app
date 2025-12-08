import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-space': '#0D0B14',
        'light-bg': '#F8FAFC',
        'warm-white': '#FFFFFF',
        'cognitive-gold': '#FFD700',
        'mastery-blue': '#4A90E2',
        'spark-turquoise': '#40E0D0',
        'clarity-white': '#FFFFFF',
        'text-dark': '#1E293B',
        'text-medium': '#475569',
      },
      fontFamily: {
        sora: ['var(--font-sora)', 'sans-serif'],
        lexend: ['var(--font-lexend)', 'sans-serif'],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
      },
      boxShadow: {
        glow: '0 0 40px rgba(255,215,0,0.25)'
      }
    },
  },
  plugins: [],
};
export default config;





