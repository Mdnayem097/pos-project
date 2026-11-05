import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Main brand color: a vivid saffron orange
        brand: {
          50: "#FFF4EA",
          100: "#FFE6D2",
          200: "#FFD2B0",
          300: "#FFB27A",
          400: "#FF8A3D",
          500: "#FF6B0A",
          600: "#E85A00",
          700: "#C24800",
          800: "#9A3A00",
          900: "#7A2E00",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-body)",
          "ui-sans-serif",
          "system-ui",
          "Noto Sans Bengali",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "var(--font-body)",
          "ui-sans-serif",
          "system-ui",
          "Noto Sans Bengali",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(12, 10, 9, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
