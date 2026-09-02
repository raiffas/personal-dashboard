import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls to the Express server (see src/index.ts) during
    // local dev, so the browser only ever talks to Vite's single origin.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
