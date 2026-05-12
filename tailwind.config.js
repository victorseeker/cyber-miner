/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#030712',      // 极致深黑
          cyan: '#06b6d4',    // 荧光青
          yellow: '#eab308',  // 耀眼黄
          pink: '#ec4899',    // 霓虹粉
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.5)',
        'neon-yellow': '0 0 15px rgba(234, 179, 8, 0.5)',
        'neon-pink': '0 0 15px rgba(236, 72, 153, 0.5)',
      }
    },
  },
  plugins: [],
}