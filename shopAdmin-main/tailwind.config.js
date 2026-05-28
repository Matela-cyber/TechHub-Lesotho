module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        admin: {
          50: "#f4f8fe",
          100: "#ebf2fb",
          200: "#d7e4f4",
          300: "#adc7e8",
          400: "#7da6d6",
          500: "#4f84c1",
          600: "#2f66a3",
          700: "#214a77",
          800: "#173454",
          900: "#11253c",
        },
        mint: {
          50: "#eefcf8",
          100: "#cef7eb",
          200: "#a1ecd9",
          300: "#68dbc1",
          400: "#2fc3a8",
          500: "#0f9d8a",
          600: "#0b7f71",
          700: "#0c665c",
          800: "#0e524a",
          900: "#0e443d",
        },
      },
      fontFamily: {
        sans: ["Segoe UI", "Trebuchet MS", "Helvetica Neue", "sans-serif"],
      },
      boxShadow: {
        panel: "0 18px 42px rgba(20, 35, 58, 0.08)",
      },
    },
  },
  plugins: [],
};
