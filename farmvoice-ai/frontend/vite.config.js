import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite dev server proxies /api requests to the Flask backend so that
// cookie-based JWT (HttpOnly, SameSite=Lax) works on a single origin (5173).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
