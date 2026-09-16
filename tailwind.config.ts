import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        airtable: {
          primary: "#181d26",
          primaryActive: "#0d1218",
          ink: "#181d26",
          body: "#333840",
          muted: "#41454d",
          hairline: "#dddddd",
          borderStrong: "#9297a0",
          canvas: "#ffffff",
          surfaceSoft: "#f8fafc",
          surfaceStrong: "#e0e2e6",
          surfaceDark: "#181d26",
          surfaceDarkElevated: "#1d1f25",
          signatureCoral: "#aa2d00",
          signatureForest: "#0a2e0e",
          signatureCream: "#f5e9d4",
          signaturePeach: "#fcab79",
          signatureMint: "#a8d8c4",
          signatureYellow: "#f4d35e",
          signatureMustard: "#d9a441",
          link: "#1b61c9",
          linkActive: "#1a3866",
          info: "#254fad",
          infoBorder: "#458fff",
          success: "#006400",
          successBorder: "#39bf45",
        },
        // Preserve brand aliases for compatibility while redirecting to Airtable palette
        brand: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#181d26",
          600: "#0d1218",
          700: "#090d12",
          800: "#05070a",
          900: "#020304",
        }
      },
      borderRadius: {
        xs: "2px",
        sm: "6px",
        md: "10px",
        lg: "12px",
        pill: "9999px",
      },
      fontFamily: {
        sans: ["Haas", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Haas Groot Disp", "Haas", "Inter", "sans-serif"],
        friem: ["var(--font-friem)", "Friem", "cursive", "sans-serif"],
      },
      spacing: {
        section: "96px",
      }
    },
  },
  plugins: [],
};
export default config;
