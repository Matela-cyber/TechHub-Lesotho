module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#f1f5f9",
          100: "#e8edf5",
          200: "#d1dae8",
          700: "#2a3847",
          800: "#1a2535",
          900: "#111827",
          950: "#0a0f1a",
        },
        accent: {
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
