/** @type {import('tailwindcss').Config} */
module.exports = {
  // O array 'content' corrigido, que aponta para os arquivos do Expo Router
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./app/(auth)/**/*.{js,jsx,ts,tsx}",
    "./app/(tabs)/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  
  // A sua linha 'presets', que é essencial
  presets: [require("nativewind/preset")],
  
  theme: {
    extend: {},
  },
  plugins: [],
}