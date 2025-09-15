import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: 3000,
    host: true, // Allow external connections
  },
  preview: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
