/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#3b82f6",
          success: "#06b6d4",
          surface: "#ffffff",
          bg: "#f9fafb",
          text: "#111827",
          muted: "#64748b",
          danger: "#EF4444",
        },
      },
    },
  },
  plugins: [],
};
