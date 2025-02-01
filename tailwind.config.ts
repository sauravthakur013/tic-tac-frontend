import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        back:'#1B1833',
        purple:'#441752',
        red:'#AB4459',
        yellow:'#F29F58'
      },
    },
  },
  plugins: [],
} satisfies Config;
