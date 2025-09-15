import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Allow external connections
    proxy: {
      '/api': 'http://3.142.250.63:5000/api/'
    }

  },
  preview: {
    port: 3000,
    host: true,
  },
});
