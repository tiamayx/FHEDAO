import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        foreground: "#FAFAFA",
        muted: "#27272A",
        "muted-foreground": "#A1A1AA",
        accent: "#DFE104",
        "accent-foreground": "#000000",
        border: "#3F3F46",
      },
      fontFamily: {
        sans: ["Space Grotesk", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

