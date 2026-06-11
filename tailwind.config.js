/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#059669", // Emerald 600
        secondary: "#10b981", // Emerald 400
        accent: "#f59e0b", // Amber 400
      },
    },
  },
  plugins: [],
}