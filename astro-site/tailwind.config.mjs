/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Exact Squarespace palette
        'dc-white':        'hsl(0, 0%, 100%)',
        'dc-light':        'hsl(30, 20%, 96.08%)',   // lightAccent – warm cream
        'dc-accent':       'hsl(261.76, 38.72%, 46.08%)', // purple/violet
        'dc-dark':         'hsl(346, 60%, 30%)',      // darkAccent – burgundy red
        'dc-black':        'hsl(200, 9%, 19%)',       // dark blue-grey
      },
      fontFamily: {
        'syne':      ['Syne', 'sans-serif'],
        'syne-mono': ['Syne Mono', 'monospace'],
        'amatic':    ['Amatic SC', 'cursive'],
      },
      fontSize: {
        'hero':   ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1.1' }],
        'display':['clamp(1.75rem, 4vw, 3rem)', { lineHeight: '1.15' }],
      },
    },
  },
  plugins: [],
};
