/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#080B0A",
          surface: "#101512",
          card: "#131A16",
          hover: "#18231C",
          input: "#0B0F0D",
        },
        emerald: {
          accent: "#22C55E",
          mint: "#86EFAC",
          muted: "#15803D",
          deep: "#052e16",
        },
        soft: "#F3F4F6",
        dim: "#9CA3AF",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "emerald-glow": "0 0 25px -5px rgba(34, 197, 94, 0.15)",
        "emerald-glow-strong": "0 0 35px 2px rgba(34, 197, 94, 0.25)",
      },
    },
  },
  plugins: [],
};
