import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base Block Theme Colors
        primary: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#1d4ed8',
        },
        secondary: {
          DEFAULT: '#8BC34A',
          light: '#AED581',
          dark: '#6FAE3E',
        },
        background: {
          DEFAULT: '#000000',
          dark: '#0a0a0a',
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
        "gradient-secondary": "linear-gradient(135deg, #8BC34A 0%, #6FAE3E 100%)",
      },
    },
  },
  plugins: [],
};
export default config;

