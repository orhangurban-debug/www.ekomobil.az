import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /** EkoMobil rəng palitrası – docs/COLOR_SYSTEM.md */
        "deep-base": "#3E2F28",
        "clean-space": "#FFFFFF",
        "ocean-teal": {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#0891b2",
          600: "#0e7490",
          700: "#155e75",
          800: "#164e63",
          900: "#164e63"
        },
        "soft-brown": "#E5D3B3",
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#0891b2",
          600: "#0e7490",
          700: "#155e75",
          800: "#164e63",
          900: "#164e63"
        },
        trust: {
          green: "#16a34a",
          amber: "#d97706",
          red: "#dc2626"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem"
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,.08), 0 4px 16px 0 rgba(0,0,0,.06)",
        "card-hover": "0 4px 6px 0 rgba(0,0,0,.08), 0 12px 32px 0 rgba(0,0,0,.1)"
      }
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("@tailwindcss/typography")]
};

export default config;
