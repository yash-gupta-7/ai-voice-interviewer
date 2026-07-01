import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves from /<repo-name>/ subpath
  base: command === "build" ? "/ai-voice-interviewer/" : "/",
  server: {
    port: 5173,
    proxy: {
      // Proxy /api HTTP requests to the FastAPI backend
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      // Proxy /api/ws WebSocket connections to the FastAPI backend
      "/api/ws": {
        target: "ws://localhost:8000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
}));
