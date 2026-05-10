/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Inter",
          "Segoe UI",
          "sans-serif"
        ]
      },
      boxShadow: {
        soft: "0 22px 70px rgba(0, 0, 0, 0.35)",
        card: "0 14px 45px rgba(0, 0, 0, 0.28)"
      }
    }
  },
  plugins: []
};
