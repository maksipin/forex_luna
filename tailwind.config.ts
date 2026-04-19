/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Убедись, что это именно строка 'class'
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Убедись, что путь охватывает все файлы
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}