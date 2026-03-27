import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#fbf7f1",
        ink: "#10231c",
        highlight: "#ffb169",
        sea: "#0d7665",
        dusk: "#214658",
        rose: "#d4746d"
      },
      boxShadow: {
        soft: "0 20px 55px rgba(16, 35, 28, 0.08)"
      },
      fontFamily: {
        sans: ["Avenir Next", "Segoe UI", "sans-serif"],
        display: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "serif"]
      }
    }
  },
  plugins: []
};

export default config;

