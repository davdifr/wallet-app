import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px"
      }
    },
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 6px)",
        xl: "calc(var(--radius) + 8px)"
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))"
      },
      fontFamily: {
        sans: ["var(--font-manrope)"],
        display: ["var(--font-space-grotesk)"]
      },
      boxShadow: {
        soft: "0 10px 24px rgba(0, 0, 0, 0.22)",
        card: "0 2px 12px rgba(0, 0, 0, 0.18)",
        float: "0 16px 36px rgba(0, 0, 0, 0.28)"
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem"
      },
      fontSize: {
        "xs-ui": ["11px", { lineHeight: "16px", letterSpacing: "0.04em" }],
        "sm-ui": ["13px", { lineHeight: "18px" }],
        "md-ui": ["15px", { lineHeight: "22px" }],
        "lg-ui": ["18px", { lineHeight: "26px" }],
        "xl-ui": ["24px", { lineHeight: "30px", letterSpacing: "-0.02em" }],
        "2xl-ui": ["32px", { lineHeight: "36px", letterSpacing: "-0.03em" }]
      }
    }
  },
  plugins: []
};

export default config;
