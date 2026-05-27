import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ember: "#e85d04",
        flame: "#d62828",
        gold: "#f5b942",
        wood: "#5a2e17",
        coal: "#160f0b",
        cream: "#fff3df"
      },
      boxShadow: {
        glow: "0 0 40px rgba(232, 93, 4, 0.24)"
      }
    }
  },
  plugins: []
};

export default config;
