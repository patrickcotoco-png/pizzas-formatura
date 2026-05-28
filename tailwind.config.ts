import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ember: "#F28C00",
        flame: "#0057A8",
        gold: "#F6B800",
        wood: "#0B2F66",
        coal: "#020B1F",
        cream: "#E5E7EB"
      },
      boxShadow: {
        glow: "0 0 40px rgba(246, 184, 0, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
